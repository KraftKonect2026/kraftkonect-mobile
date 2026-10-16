// Fast checks for the account-deletion adapter (no backend needed).
const assert = require("node:assert/strict"), load = require("./load-typescript.cjs");
const d = load("lib/account/liveDeletion.ts"), acc = load("lib/account/liveAccount.ts");
let count = 0;
async function check(name, run) { await run(); count++; console.log("PASS " + name); }
const client = result => { const calls = []; return { calls, mutate: async o => { calls.push(o); if (result instanceof Error) throw result; return { data: result }; } }; };
const apollo = (status, message, code) => Object.assign(new Error("Response not successful: Received status code " + status), { networkError: { result: { errors: [{ message, extensions: { code } }] } } });

(async () => {
  await check("The code request is scoped to the signed-in account and returns only the id to send back", async () => {
    const c = client({ requestAccountDeletionCode: { pinId: "abc123", expiresAt: "2030-01-01T00:00:00Z" } });
    assert.equal(await d.askDeletionCode(c, "u1"), "abc123");
    assert.equal(c.calls[0].context.accountOwnerId, "u1");
    await assert.rejects(d.askDeletionCode(client({ requestAccountDeletionCode: { pinId: "" } }), "u1"), /did not send a code/);
    await assert.rejects(d.askDeletionCode(client(apollo(400, "Add a phone number to your account first, or contact support.", "BAD_REQUEST")), "u1"), /Add a phone number/);
    await assert.rejects(d.askDeletionCode(client(apollo(429, "Please wait a minute before asking for another code.", "RATE_LIMITED")), "u1"), /wait a minute/);
  });
  await check("Requesting deletion always says it is confirmed, sends the code, and needs six digits", async () => {
    const c = client({ requestAccountDeletion: { requestedAt: "2030-01-01T00:00:00Z", noticeEndsAt: "2030-01-31T00:00:00Z" } });
    assert.deepEqual(await d.requestDeletion(c, "u1", "pin1", "123456"), { noticeEndsAt: "2030-01-31T00:00:00Z" });
    assert.deepEqual(c.calls[0].variables, { pinId: "pin1", code: "123456", confirmed: true });
    for (const bad of ["", "12345", "1234567", "abcdef"]) await assert.rejects(d.requestDeletion(c, "u1", "pin1", bad), /6-digit/);
    assert.equal(c.calls.length, 1, "a bad code never reaches the server");
    await assert.rejects(d.requestDeletion(client({ requestAccountDeletion: { requestedAt: "x", noticeEndsAt: "not a date" } }), "u1", "pin1", "123456"), /did not confirm/);
    await assert.rejects(d.requestDeletion(client(apollo(400, "That code doesn’t match.", "OTP_INVALID")), "u1", "pin1", "123456"), /doesn’t match/);
    await assert.rejects(d.requestDeletion(client(apollo(409, "A payment is still being confirmed on one of your jobs.", "CONFLICT")), "u1", "pin1", "123456"), /still being confirmed/);
  });
  await check("The notice day reads as a Lagos calendar date", () => {
    assert.equal(d.noticeDay("2030-01-31T23:30:00Z"), "1 February 2030");
  });
  await check("The deletion steps are known account screens", () => {
    for (const s of ["delete", "delete-activity", "delete-confirm", "delete-code"]) assert.equal(acc.liveAccountStep(s), s);
    assert.equal(acc.liveAccountStep("delete-everything"), "details");
  });
  console.log(count + " live deletion checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
