// Fast checks for the live recovery adapter (no backend needed). The end-to-end contract against the real
// backend lives in the backend repo's test-recovery.ts; this guards the app-side rules.
const assert = require("node:assert/strict"), load = require("./load-typescript.cjs");
const r = load("lib/account/liveRecovery.ts");
let count = 0;
async function check(name, run) { await run(); count++; console.log("PASS " + name); }
const client = result => { const calls = []; return { calls, mutate: async o => { calls.push(o); if (result instanceof Error) throw result; return { data: result }; } }; };
const apollo = (status, message, code) => Object.assign(new Error("Response not successful: Received status code " + status), { networkError: { result: { errors: [{ message, extensions: { code } }] } } });
const questions = () => [1, 2, 3, 4].map(n => ({ id: "q" + n, label: "Question " + n, options: [{ id: "a" + n, label: "A" }, { id: "b" + n, label: "B" }, { id: "c" + n, label: "C" }, { id: "d" + n, label: "D" }] }));

(async () => {
  await check("Email recovery sends the trimmed details and returns the session; the code is checked against that session", async () => {
    const c = client({ startEmailRecovery: { sessionId: "s1", expiresAt: "2030-01-01T00:00:00Z" } });
    assert.equal(await r.startEmailRecovery(c, "  Tobi@Example.com ", "  Tobi Adeyemi "), "s1");
    assert.deepEqual(c.calls[0].variables, { email: "Tobi@Example.com", name: "Tobi Adeyemi" });
    const v = client({ verifyRecoveryEmailCode: { sessionId: "s1", step: "phone" } });
    assert.equal(await r.verifyEmailCode(v, "s1", "123456"), "phone");
    assert.deepEqual(v.calls[0].variables, { sessionId: "s1", code: "123456" });
    await assert.rejects(r.verifyEmailCode(client({ verifyRecoveryEmailCode: { sessionId: "s1", step: "weird" } }), "s1", "123456"));
    await assert.rejects(r.startEmailRecovery(client({ startEmailRecovery: null }), "a@b.c", "A B"), /did not confirm/);
  });
  await check("The server's own sentences reach the person", async () => {
    await assert.rejects(r.startEmailRecovery(client(apollo(400, "We couldn’t verify those details. Check them and try again.", "BAD_REQUEST")), "a@b.c", "A B"), /couldn’t verify those details/);
    await assert.rejects(r.verifyEmailCode(client(apollo(400, "That code doesn’t match.", "OTP_INVALID")), "s", "123456"), /doesn’t match/);
    await assert.rejects(r.requestNewPhoneCode(client(apollo(409, "This new number belongs to another account. Your existing account is unchanged.", "CONFLICT")), "s", "+2348012345678"), /belongs to another account/);
    await assert.rejects(r.startActivity(client(apollo(429, "Too many attempts on this account this week. Please contact support.", "RATE_LIMITED")), "+2348012345678", "A B"), /contact support/);
    await assert.rejects(r.completeRecovery(client(new Error("Network request failed")), "s", "123456"), /Network request failed/);
  });
  await check("Activity recovery returns four questions, or null when the account has too little history", async () => {
    const found = await r.startActivity(client({ startActivityRecovery: { sessionId: "s2", historyAvailable: true, expiresAt: "x", questions: questions() } }), "+2348012345678", "Tobi Adeyemi");
    assert.equal(found.sessionId, "s2"); assert.equal(found.questions.length, 4);
    assert.equal(await r.startActivity(client({ startActivityRecovery: { sessionId: null, historyAvailable: false, expiresAt: null, questions: [] } }), "+2348012345678", "Tobi Adeyemi"), null);
    await assert.rejects(r.startActivity(client({ startActivityRecovery: { sessionId: "s", historyAvailable: true, expiresAt: "x", questions: questions().slice(0, 3) } }), "+2348012345678", "A B"), /could not be loaded/);
    await assert.rejects(r.startActivity(client({ startActivityRecovery: { sessionId: "s", historyAvailable: true, expiresAt: "x", questions: questions().map(q => ({ ...q, options: [q.options[0]] })) } }), "+2348012345678", "A B"));
  });
  await check("Answers are sent as one choice per question; the result is a pass or a fail", async () => {
    const c = client({ answerRecoveryActivity: { sessionId: "s2", step: "phone" } });
    assert.equal(await r.answerActivity(c, "s2", { q1: "a1", q2: "b2", q3: "c3", q4: "d4" }), "phone");
    assert.deepEqual(c.calls[0].variables.answers, [{ questionId: "q1", optionId: "a1" }, { questionId: "q2", optionId: "b2" }, { questionId: "q3", optionId: "c3" }, { questionId: "q4", optionId: "d4" }]);
    assert.equal(await r.answerActivity(client({ answerRecoveryActivity: { sessionId: "s2", step: "failed" } }), "s2", {}), "failed");
    await assert.rejects(r.answerActivity(client({ answerRecoveryActivity: { sessionId: "s2", step: "verified" } }), "s2", {}));
  });
  await check("Finishing returns the new number and the account's role, never claiming success without the server's word", async () => {
    assert.deepEqual(await r.completeRecovery(client({ completeRecoveryPhone: { recovered: true, newPhone: "+2348099999999", role: "provider" } }), "s", "123456"), { newPhone: "+2348099999999", role: "provider" });
    assert.equal((await r.completeRecovery(client({ completeRecoveryPhone: { recovered: true, newPhone: "+2348099999999", role: "admin" } }), "s", "123456")).role, "customer");
    await assert.rejects(r.completeRecovery(client({ completeRecoveryPhone: { recovered: false, newPhone: "+2348099999999", role: "customer" } }), "s", "123456"), /did not confirm/);
  });
  await check("Asking support returns the reference; going back never leaves a step that is waiting on a result", async () => {
    assert.equal(await r.askSupport(client({ requestRecoverySupport: { reference: "KK-REC-AB12CD34" } }), " Tobi ", " tobi@mail.test ", "Help"), "KK-REC-AB12CD34");
    for (const [from, to] of [["email", "choose"], ["email-code", "email"], ["identity", "choose"], ["options", "identity"], ["activity", "options"], ["phone", "choose"], ["phone-code", "phone"], ["support", "choose"], ["failed", "choose"]]) assert.equal(r.backStep(from), to, from);
    for (const done of ["choose", "recovered"]) assert.equal(r.backStep(done), null, done);
  });
  await check("Identity recovery: a new check is started only for accounts that have one, and only the server's answer moves on", async () => {
    const make = (over = {}) => ({ startIdentityRecovery: { available: true, sessionId: "s9", inquiryId: "inq_1", clientToken: "tok", inquiryUrl: "https://withpersona.com/verify?inquiry-id=inq_1", expiresAt: "x", ...over } });
    const c = client(make());
    assert.deepEqual(await r.startIdentity(c, "+2348012345678", " Provider One "), { sessionId: "s9", inquiryId: "inq_1", clientToken: "tok", inquiryUrl: "https://withpersona.com/verify?inquiry-id=inq_1" });
    assert.deepEqual(c.calls[0].variables, { oldPhone: "+2348012345678", name: "Provider One" });
    assert.equal(await r.startIdentity(client(make({ available: false, sessionId: null, inquiryId: null, clientToken: null, inquiryUrl: null })), "+2348012345678", "A B"), null);
    await assert.rejects(r.startIdentity(client(make({ inquiryUrl: "http://insecure.example/x" })), "+2348012345678", "A B"), /could not be started/);
    await assert.rejects(r.startIdentity(client(make({ inquiryId: null })), "+2348012345678", "A B"));
    for (const step of ["phone", "pending", "failed"]) assert.equal((await r.checkIdentity(client({ checkIdentityRecovery: { sessionId: "s9", step, reference: null } }), "s9")).step, step);
    assert.deepEqual(await r.checkIdentity(client({ checkIdentityRecovery: { sessionId: "s9", step: "pending", reference: "KK-REC-ABCD1234" } }), "s9"), { step: "pending", reference: "KK-REC-ABCD1234" });
    await assert.rejects(r.checkIdentity(client({ checkIdentityRecovery: { sessionId: "s9", step: "verified", reference: null } }), "s9"), /did not return a result/);
    await assert.rejects(r.checkIdentity(client(apollo(400, "We couldn’t reach the identity service just now. Try again shortly.", "BAD_REQUEST")), "s9"), /identity service/);
    assert.equal(r.backStep("pending"), "choose");
  });
  console.log(count + " live recovery checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
