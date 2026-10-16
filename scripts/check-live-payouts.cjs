// Fast checks for the real-payout adapter (no backend needed). The end-to-end contract against the
// real backend lives in the backend repo's test-payouts.ts; this guards the app-side rules.
const assert = require("node:assert/strict"), load = require("./load-typescript.cjs");
const p = load("lib/provider/livePayouts.ts"), fin = load("lib/provider/liveFinance.ts");
let count = 0;
async function check(name, run) { await run(); count++; console.log("PASS " + name); }

const payout = (over = {}) => ({ id: "p1", reference: "KK-PO-1", amountMinor: 2000000, status: "processing", bankName: "Access Bank", accountLast4: "6789", accountName: "TOBI ADEYEMI", failureReason: null, createdAt: "2030-01-05T10:00:00Z", paidAt: null, ...over });
const overview = (over = {}) => ({
  availableMinor: 5000000, pendingMinor: 4075000, reservedMinor: 2000000, repaymentOwedMinor: 0, spendableMinor: 5000000, minimumPayoutMinor: 10000,
  bank: { bankName: "Access Bank", bankCode: "044", accountLast4: "6789", accountName: "TOBI ADEYEMI", review: "verified" }, payouts: [payout()], repayments: [], ...over,
});
function client(result) {
  const calls = [];
  return { calls, mutate: async (o) => { calls.push(o); if (result instanceof Error) throw result; return { data: result }; }, query: async (o) => { calls.push(o); if (result instanceof Error) throw result; return { data: result }; } };
}
const apollo = (status, message) => Object.assign(new Error("Response not successful: Received status code " + status), { networkError: { result: { errors: [{ message }] } } });

(async () => {
  await check("A server overview becomes the wallet figures the screens show", () => {
    const o = p.parseOverview(overview());
    assert.deepEqual([o.available, o.pending, o.reserved, o.spendable, o.minimumPayout], [5000000, 4075000, 2000000, 5000000, 10000]);
    assert.equal(o.bank.accountLast4, "6789"); assert.equal(o.payouts[0].status, "processing"); assert.equal(o.payouts[0].amount, 2000000);
  });
  await check("Unreliable data is rejected rather than shown", () => {
    for (const bad of [null, {}, overview({ payouts: null }), overview({ availableMinor: -1 }), overview({ availableMinor: 1.5 }), overview({ spendableMinor: 9999999 }),
      overview({ payouts: [payout(), payout()] }), overview({ payouts: [payout({ status: "weird" })] }), overview({ bank: { bankName: "x" } }), overview({ bank: { ...overview().bank, accountLast4: "12" } })]) {
      assert.throws(() => p.parseOverview(bad));
    }
    assert.equal(p.parseOverview(overview({ bank: null })).bank, null);
  });
  await check("Amount rules match the server's, so people are told before they tap", () => {
    const o = p.parseOverview(overview({ availableMinor: 5000000, spendableMinor: 500000, repaymentOwedMinor: 4500000 }));
    assert.match(p.payoutAmountError(o, null), /greater than/); assert.match(p.payoutAmountError(o, 0), /greater than/);
    assert.match(p.payoutAmountError(o, 5000), /smallest payout is ₦100/);
    assert.match(p.payoutAmountError(o, 1000000), /set aside to repay/);
    assert.match(p.payoutAmountError(o, 6000000), /more than your available/);
    assert.equal(p.payoutAmountError(o, 500000), undefined);
    assert.match(p.payoutAmountError(p.parseOverview(overview({ bank: null })), 100000), /Add your bank/);
    assert.match(p.payoutAmountError(p.parseOverview(overview({ bank: { ...overview().bank, review: "needs_review" } })), 100000), /Contact support/);
  });
  await check("Payout statuses read plainly", () => {
    assert.equal(p.payoutStatusLabel({ status: "paid" }), "Paid"); assert.match(p.payoutStatusLabel({ status: "failed" }), /money returned/);
    assert.match(p.payoutStatusLabel({ status: "processing" }), /on its way/i); assert.equal(p.payoutStatusLabel({ status: "pending" }), "Being sent");
  });
  await check("A payout request carries a key; a dropped connection retries with the same key, a refusal starts fresh", async () => {
    const down = client(new Error("Network request failed"));
    await assert.rejects(p.requestPayout(down, "u1", 100000), /Network/);
    await assert.rejects(p.requestPayout(down, "u1", 100000), /Network/);
    assert.equal(down.calls[0].variables.idempotencyKey, down.calls[1].variables.idempotencyKey);
    const refused = client(apollo(409, "That is more than your available balance."));
    await assert.rejects(p.requestPayout(refused, "u2", 100000), /more than your available/);
    await assert.rejects(p.requestPayout(refused, "u2", 100000), /more than your available/);
    assert.notEqual(refused.calls[0].variables.idempotencyKey, refused.calls[1].variables.idempotencyKey);
    const good = client({ requestWalletPayout: payout() });
    const made = await p.requestPayout(good, "u3", 2000000);
    assert.equal(made.id, "p1"); assert.deepEqual([good.calls[0].variables.amountMinor, typeof good.calls[0].variables.idempotencyKey], [2000000, "string"]);
    await p.requestPayout(good, "u3", 2000000);
    assert.notEqual(good.calls[0].variables.idempotencyKey, good.calls[1].variables.idempotencyKey, "a settled request does not reuse its key");
  });
  await check("Saving a bank sends only the code and number, and returns the server's confirmed account", async () => {
    const c = client({ saveBankAccount: overview().bank });
    const bank = await p.saveBankAccount(c, "u1", "044", "0123456789");
    assert.deepEqual(c.calls[0].variables, { bankCode: "044", accountNumber: "0123456789" }); assert.equal(bank.accountLast4, "6789");
    await assert.rejects(p.saveBankAccount(client(apollo(400, "We couldn’t find that account. Check the bank and account number.")), "u1", "044", "0123456789"), /couldn’t find that account/);
    await assert.rejects(p.saveBankAccount(client({ saveBankAccount: null }), "u1", "044", "0123456789"));
  });
  await check("Account lookup returns the name, or the server's reason", async () => {
    assert.equal(await p.resolveAccountName(client({ resolveBankAccount: { accountName: " TOBI ADEYEMI " } }), "u1", {}, "044", "0123456789"), "TOBI ADEYEMI");
    await assert.rejects(p.resolveAccountName(client({ resolveBankAccount: {} }), "u1", {}, "044", "0123456789"), /couldn’t find/);
    assert.deepEqual(await p.loadBanks(client({ banks: [{ name: "Access Bank", code: "044" }, { name: 1, code: "x" }] }), "u1", {}), [{ name: "Access Bank", code: "044" }]);
    await assert.rejects(p.loadBanks(client({ banks: null }), "u1", {}), /bank list/);
  });
  await check("The finance read keeps the new overview next to the older reads, and a failure leaves the rest intact", async () => {
    const me = { id: "u1" }, reader = (extra = {}) => ({ me: async () => me, profile: async () => ({ id: "p1" }), balance: async () => 0, payouts: async () => [], bank: async () => null, isCurrent: () => true, ...extra });
    const ok = await fin.readOwnedProviderFinance("u1", reader({ overview: async () => overview() }));
    assert.equal(ok.overview.spendable, 5000000); assert.deepEqual(ok.errors, []);
    const bad = await fin.readOwnedProviderFinance("u1", reader({ overview: async () => { throw new Error("x"); } }));
    assert.equal(bad.overview, undefined); assert.ok(bad.errors.some(e => /wallet and payout/.test(e))); assert.equal(bad.reportedBalance, 0);
    const none = await fin.readOwnedProviderFinance("u1", reader());
    assert.equal(none.overview, undefined); assert.deepEqual(none.errors, []);
  });
  console.log(count + " live payout checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
