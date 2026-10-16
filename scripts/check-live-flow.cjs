// Fast checks for the live request/inspection/quote adapter (no backend needed).
// The end-to-end contract against the real backend lives in the backend repo's
// test-request-flow.ts; this guards the app-side translation rules.
const assert = require("node:assert/strict"), load = require("./load-typescript.cjs");
const flow = load("lib/bookings/liveFlow.ts"), model = load("lib/bookings/model.ts");

let count = 0;
async function check(name, run) { await run(); count++; console.log("PASS " + name); }

const quote = (over = {}) => ({ id: "q1", version: 1, status: "sent", scope: "Replace the trap and reseal.", materialsMinor: 4000000, labourMinor: 5000000, totalMinor: 9000000, depositCreditMinor: 500000, remainingMinor: 8500000, workDate: "2030-01-09", workTime: "09:00", duration: "3 hours", ...over });
const base = (over = {}) => ({
  id: "b1", revision: 3, stage: "response", status: "pending", customerId: "c1", customerName: "Tomi", providerId: "p1", providerName: "Tobi", providerUserId: "u2",
  serviceId: "l1", serviceTitle: "Kitchen plumbing repair", area: "Lekki", preferredDate: "2030-01-05", description: "Leaking sink under the cabinet.", serviceMode: "onsite",
  terms: { version: 1, minimumMinor: 1500000, maximumMinor: 3000000, depositMinor: 500000, date: "2030-01-07", time: "10:00", mode: "onsite" },
  depositVerified: false, depositPayment: null, balancePayment: null, inspectionDate: "2030-01-07", inspectionTime: "10:00", address: null, findings: null,
  quote: null, acceptedQuote: null, workDate: null, workTime: null, dateProposal: null, cancelledBy: null, cancelReason: null, conversationId: "cv1", ...over,
});
function fakeClient(result) {
  const calls = [];
  return { calls, mutate: async (o) => { calls.push(o); if (result instanceof Error) throw result; return { data: result }; }, query: async () => ({ data: {} }) };
}

(async () => {
  await check("A server booking maps to a live record the app's own helpers understand", () => {
    const r = flow.flowToRecord(base());
    assert.equal(r.source, "live"); assert.equal(r.stage, "response"); assert.equal(r.revision, 3);
    assert.deepEqual(r.terms, { version: 1, minimum: 1500000, maximum: 3000000, deposit: 500000, date: "2030-01-07", time: "10:00" });
    assert.equal(model.statusFor(r), "Response received"); assert.equal(model.sectionFor(r), "pending"); assert.equal(model.inspectionVerified(r), false);
    assert.deepEqual([r.commands, r.events, r.messages], [[], [], []]);
  });
  await check("An unknown stage falls back safely and missing names get neutral labels", () => {
    const r = flow.flowToRecord(base({ stage: "something_new", customerName: null, providerName: null, serviceTitle: null }));
    assert.equal(r.stage, "request"); assert.equal(r.customerName, "Customer"); assert.equal(r.providerName, "Provider"); assert.equal(r.serviceTitle, "Requested service");
  });
  await check("Malformed or empty server data is rejected, not displayed", () => {
    for (const bad of [null, undefined, {}, { id: "" }]) assert.throws(() => flow.flowToRecord(bad));
  });
  await check("A verified deposit makes the app's verification pass; pending/failed ones do not", () => {
    const pay = (status) => ({ reference: "ref-1", status, amountMinor: 500000, termsVersion: 1, quoteVersion: null });
    const verified = flow.flowToRecord(base({ stage: "inspection_scheduled", depositVerified: true, depositPayment: pay("verified"), address: "12 Admiralty Way" }));
    assert.equal(model.inspectionVerified(verified), true); assert.equal(model.sectionFor(verified), "active"); assert.equal(model.exactAddress(verified, "customer"), "12 Admiralty Way");
    for (const status of ["pending", "failed"]) { const r = flow.flowToRecord(base({ depositPayment: pay(status) })); assert.equal(model.inspectionVerified(r), false); }
    const mismatch = flow.flowToRecord(base({ stage: "inspection_scheduled", depositVerified: true, depositPayment: { ...pay("verified"), amountMinor: 1 } }));
    assert.equal(model.inspectionVerified(mismatch), false, "an amount that differs from the agreed deposit is not accepted");
  });
  await check("The latest quote and an accepted quote map with the deposit credit and the provider's own duration text", () => {
    const paid = { reference: "ref-1", status: "verified", amountMinor: 500000, termsVersion: 1 };
    const r = flow.flowToRecord(base({ stage: "quote_sent", depositVerified: true, depositPayment: paid, quote: quote() }));
    assert.deepEqual([r.quote.total, r.quote.depositCredit, r.quote.remaining, r.quote.duration], [9000000, 500000, 8500000, "3 hours"]);
    assert.equal(model.quoteConsistent(r, r.quote), true); assert.equal(model.statusFor(r), "Final quote ready"); assert.equal(r.acceptedQuote, undefined);
    const accepted = flow.flowToRecord(base({ stage: "quote_sent", depositVerified: true, depositPayment: paid, quote: quote({ status: "accepted" }), acceptedQuote: quote({ status: "accepted" }) }));
    assert.equal(accepted.acceptedQuote.version, 1);
    assert.equal(flow.flowToRecord(base({ quote: quote({ duration: null }) })).quote, undefined, "a quote missing required fields is not shown");
  });
  await check("Cancellation, proposals and appointments map; admin actors show as the provider side", () => {
    const r = flow.flowToRecord(base({ status: "cancelled", cancelledBy: "customer", cancelReason: "Changed my mind", dateProposal: { id: "d1", purpose: "work", date: "2030-02-01", time: "09:00", by: "admin", version: 2, status: "proposed" } }));
    assert.deepEqual(r.cancelled, { by: "customer", reason: "Changed my mind" }); assert.equal(model.sectionFor(r), "cancelled");
    assert.deepEqual(r.dateProposal, { id: "d1", version: 2, purpose: "work", status: "proposed", by: "provider", date: "2030-02-01", time: "09:00" });
    assert.equal(flow.flowToRecord(base({ dateProposal: { id: "d1", purpose: "inspection", date: "2030-02-01", time: "09:00", by: "customer", version: 1, status: "accepted" } })).dateProposal, undefined, "only open proposals are shown");
    assert.deepEqual(flow.flowToRecord(base()).inspectionAppointment, { date: "2030-01-07", time: "10:00" });
  });
  await check("Provider response sends kobo amounts, the date/time and the service mode", async () => {
    const c = fakeClient({ respondToRequest: base() });
    await flow.runFlowCommand(c, "u2", "provider", base({ serviceMode: "remote" }), { type: "respond", draft: { minimum: "15,000", maximum: "30000.50", deposit: "5000", date: "2030-01-07", time: "10:00" } });
    const o = c.calls[0];
    assert.deepEqual(o.variables, { bookingId: "b1", revision: 3, input: { minimumMinor: 1500000, maximumMinor: 3000050, depositMinor: 500000, date: "2030-01-07", time: "10:00", mode: "remote" } });
    assert.deepEqual(o.context, { accountOwnerId: "u2", queryDeduplication: false }, "every call is scoped to the signed-in account");
    await assert.rejects(flow.runFlowCommand(c, "u2", "provider", base(), { type: "respond", draft: { minimum: "abc", maximum: "1", deposit: "1", date: "x", time: "y" } }), /valid amounts/);
  });
  await check("Cancel goes to the customer mutation and decline to the provider mutation", async () => {
    const cc = fakeClient({ cancelRequest: base() }), pc = fakeClient({ declineRequest: base() });
    await flow.runFlowCommand(cc, "c1", "customer", base(), { type: "cancel_request", reason: "No longer needed" });
    await flow.runFlowCommand(pc, "u2", "provider", base(), { type: "cancel_request", reason: "Too far away" });
    assert.match(cc.calls[0].mutation.loc.source.body, /cancelRequest\(/); assert.match(pc.calls[0].mutation.loc.source.body, /declineRequest\(/);
  });
  await check("Quote, completion and date commands carry the right variables", async () => {
    const q = fakeClient({ sendFinalQuote: base() });
    await flow.runFlowCommand(q, "u2", "provider", base(), { type: "send_quote", draft: { scope: "Replace the trap.", materials: "40,000", labour: "50000", date: "2030-01-09", time: "09:00", duration: "3 hours" } });
    assert.deepEqual(q.calls[0].variables.input, { scope: "Replace the trap.", materialsMinor: 4000000, labourMinor: 5000000, workDate: "2030-01-09", workTime: "09:00", duration: "3 hours" });
    const i = fakeClient({ completeInspection: base() });
    await flow.runFlowCommand(i, "u2", "provider", base(), { type: "complete_inspection", findings: "Corroded trap." });
    assert.equal(i.calls[0].variables.findings, "Corroded trap.");
    const p = fakeClient({ proposeDate: base() }), a = fakeClient({ respondToDateProposal: base() });
    await flow.runFlowCommand(p, "u2", "provider", base(), { type: "propose_date", purpose: "inspection", date: "2030-01-11", time: "13:30" });
    await flow.runFlowCommand(a, "c1", "customer", base(), { type: "respond_date", proposalId: "d1", version: 1, accept: true });
    assert.deepEqual([p.calls[0].variables.purpose, p.calls[0].variables.date, p.calls[0].variables.time], ["inspection", "2030-01-11", "13:30"]);
    assert.deepEqual([a.calls[0].variables.proposalId, a.calls[0].variables.accept], ["d1", true]);
    await assert.rejects(flow.runFlowCommand(q, "u2", "provider", base(), { type: "send_quote", draft: { scope: "x", materials: "bad", labour: "1", date: "d", time: "t", duration: "d" } }), /valid materials/);
  });
  await check("Accepting a quote and every payment/work step is refused before any server call", async () => {
    const c = fakeClient({});
    for (const type of ["accept_quote", "checkout", "payment", "balance_checkout", "balance_payment", "ledger_snapshot", "start_work", "finish_work", "confirm_work", "cancel_paid", "report", "submit_review", "recover_materials", "refund_update"]) {
      await assert.rejects(flow.runFlowCommand(c, "c1", "customer", base(), { type }), /needs payments/, type);
    }
    assert.equal(c.calls.length, 0, "no request reached the server");
  });
  await check("Messages are not sent through the booking; read receipts are a safe no-op", async () => {
    const c = fakeClient({});
    await assert.rejects(flow.runFlowCommand(c, "c1", "customer", base(), { type: "message", text: "hi" }), /Message/);
    const same = base(); assert.equal(await flow.runFlowCommand(c, "c1", "customer", same, { type: "mark_messages_read", conversationId: "x", throughId: "y" }), same);
    assert.equal(c.calls.length, 0);
  });
  await check("A missing server confirmation is an error, never a silent success", async () => {
    await assert.rejects(flow.runFlowCommand(fakeClient({ respondToRequest: null }), "u2", "provider", base(), { type: "complete_inspection", findings: "x".repeat(12) }), /did not confirm/);
    await assert.rejects(flow.runFlowCommand(fakeClient(new Error("offline")), "u2", "provider", base(), { type: "complete_inspection", findings: "x".repeat(12) }), /offline/);
  });
  await check("Send request returns the server's proof; a failed send reuses its key so a retry cannot duplicate", async () => {
    const draft = { version: 1, providerId: "p1", serviceId: "l1", area: "Lekki", date: "2030-01-05", description: "Leaking sink under the cabinet." };
    const failing = fakeClient(new Error("Network request failed")); await assert.rejects(flow.sendServiceRequest(failing, "c1", draft), /Network/);
    const ok = fakeClient({ createServiceRequest: base({ stage: "request" }) }); const receipt = await flow.sendServiceRequest(ok, "c1", draft);
    assert.equal(failing.calls[0].variables.input.idempotencyKey, ok.calls[0].variables.input.idempotencyKey, "same draft, same key");
    assert.deepEqual(receipt, { id: "b1", providerId: "p1", serviceId: "l1", status: "pending", conversationId: "cv1" });
    const again = fakeClient({ createServiceRequest: base() }); await flow.sendServiceRequest(again, "c1", draft);
    assert.notEqual(again.calls[0].variables.input.idempotencyKey, ok.calls[0].variables.input.idempotencyKey, "a new send after success is a new request");
    const other = fakeClient({ createServiceRequest: base() }); await flow.sendServiceRequest(other, "c2", draft);
    assert.equal(other.calls[0].variables.input.listingId, "l1");
  });
  console.log(count + " live request-flow checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
