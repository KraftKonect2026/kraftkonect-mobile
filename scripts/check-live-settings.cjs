// Fast checks for the account settings adapters (no backend needed).
const assert = require("node:assert/strict"), load = require("./load-typescript.cjs");
const prefs = load("lib/account/livePrefs.ts"), contact = load("lib/account/liveContact.ts"), acct = load("lib/account/liveAccount.ts"), help = load("lib/support/liveHelp.ts"), manage = load("lib/provider/liveManage.ts");
let count = 0;
async function check(name, run) { await run(); count++; console.log("PASS " + name); }
const client = result => { const calls = []; return { calls, query: async o => { calls.push(o); if (result instanceof Error) throw result; return { data: result }; }, mutate: async o => { calls.push(o); if (result instanceof Error) throw result; return { data: result }; } }; };
const apollo = (status, message) => Object.assign(new Error("Response not successful: Received status code " + status), { networkError: { result: { errors: [{ message }] } } });
const all = (over = {}) => ({ bookingUpdates: true, newMessages: true, promotions: false, emailNotifications: true, pushNotifications: true, ...over });

(async () => {
  await check("Notification settings load as five switches in a fixed order, push first", async () => {
    const p = await prefs.loadPrefs(client({ myNotificationPreferences: all() }), "u1");
    assert.deepEqual(p, all());
    assert.deepEqual(prefs.PREF_ROWS.map(r => r.key), ["pushNotifications", "bookingUpdates", "newMessages", "emailNotifications", "promotions"]);
    for (const bad of [null, {}, { ...all(), promotions: "no" }, { bookingUpdates: true }]) assert.throws(() => prefs.parsePrefs(bad));
  });
  await check("Changing one switch sends only that switch and returns the server's saved settings", async () => {
    const c = client({ updateNotificationPreferences: all({ promotions: true }) });
    const saved = await prefs.savePref(c, "u1", "promotions", true);
    assert.deepEqual([c.calls[0].variables, c.calls[0].context.accountOwnerId, saved.promotions], [{ input: { promotions: true } }, "u1", true]);
    await assert.rejects(prefs.savePref(c, "u1", "somethingElse", true), /Unknown setting/);
    await assert.rejects(prefs.savePref(client(apollo(401, "Not authenticated")), "u1", "newMessages", false), /Not authenticated/);
    await assert.rejects(prefs.loadPrefs(client(new Error("Network request failed")), "u1"), /Network request failed/);
  });
  await check("The security check and phone change send codes in order and never claim success without the server", async () => {
    const c1 = client({ startSecurityCheck: { pinId: "pin1", expiresAt: "x" } });
    assert.equal(await contact.startCheck(c1, "u1"), "pin1"); assert.equal(c1.calls[0].context.accountOwnerId, "u1");
    await assert.rejects(contact.confirmCheck(client({}), "u1", "pin1", "12345"), /6-digit/);
    const c2 = client({ confirmSecurityCheck: { proofId: "proof1", expiresAt: "x" } });
    assert.equal(await contact.confirmCheck(c2, "u1", "pin1", "123456"), "proof1"); assert.deepEqual(c2.calls[0].variables, { pinId: "pin1", code: "123456" });
    const c3 = client({ requestPhoneChangeCode: { expiresAt: "x" } });
    await contact.sendNewPhoneCode(c3, "u1", "proof1", "+2348012345678"); assert.deepEqual(c3.calls[0].variables, { proofId: "proof1", newPhone: "+2348012345678" });
    await contact.confirmNewPhone(client({ confirmPhoneChange: true }), "u1", "proof1", "123456");
    await assert.rejects(contact.confirmNewPhone(client({ confirmPhoneChange: false }), "u1", "proof1", "123456"), /did not confirm/);
    await assert.rejects(contact.confirmNewPhone(client(apollo(409, "This number belongs to another account.")), "u1", "proof1", "123456"), /another account/);
  });
  await check("A recovery email sends its address (and the confirmation when replacing one), then needs the code", async () => {
    const c = client({ requestRecoveryEmailCode: { expiresAt: "x" } });
    await contact.sendEmailCode(c, "u1", "  a@b.co ", "proof1"); await contact.sendEmailCode(c, "u1", "a@b.co");
    assert.deepEqual([c.calls[0].variables, c.calls[1].variables], [{ email: "a@b.co", proofId: "proof1" }, { email: "a@b.co", proofId: null }]);
    await assert.rejects(contact.sendEmailCode(client(apollo(403, "Confirm your current phone number first.")), "u1", "a@b.co"), /Confirm your current phone/);
    await contact.confirmEmail(client({ confirmRecoveryEmail: true }), "u1", "123456");
    await assert.rejects(contact.confirmEmail(client({}), "u1", "abc"), /6-digit/);
    assert.equal(contact.maskedEmail("tobi@example.com"), "t•••@example.com");
  });
  await check("A name change says whether it is in use or waiting for support", async () => {
    const c = client({ changeMyName: { applied: true, name: "Dayo Olu", reference: null } });
    assert.deepEqual(await contact.changeName(c, "u1", " Dayo ", " Olu "), { applied: true, name: "Dayo Olu" }); assert.deepEqual(c.calls[0].variables, { name: "Dayo Olu" });
    assert.deepEqual(await contact.changeName(client({ changeMyName: { applied: false, name: "Pat Provider", reference: "KK-NAME-ABC123" } }), "u1", "Patricia", "Provider"), { applied: false, name: "Pat Provider", reference: "KK-NAME-ABC123" });
    await assert.rejects(contact.changeName(client(apollo(409, "You already have a name change waiting for review.")), "u1", "A", "B"), /waiting for review/);
  });
  await check("Pausing and resuming a provider profile follow the server's state; the profile status reaches the account page", async () => {
    assert.equal(await contact.setProfilePaused(client({ pauseProviderProfile: { state: "paused" } }), "u1", true), "paused");
    assert.equal(await contact.setProfilePaused(client({ resumeProviderProfile: { state: "active" } }), "u1", false), "active");
    await assert.rejects(contact.setProfilePaused(client({ pauseProviderProfile: { state: "weird" } }), "u1", true), /did not confirm/);
    const snap = acct.accountReadSnapshot("u1", { id: "u1", name: "Pat Provider", phone: "+2348012345678", email: "p@x.co", emailVerified: true }, { id: "p1", status: "deactivated", kycStatus: "approved" });
    assert.deepEqual([snap.providerStatus, snap.contactEmail, snap.contactEmailVerified], ["deactivated", "p@x.co", true]);
    for (const s of ["phone-check", "phone-new", "phone-new-code", "email-code", "deactivate-confirm"]) assert.equal(acct.liveAccountStep(s), s);
  });
  await check("A help conversation maps to bubbles from you and from support; closed ones show their outcome", () => {
    const t = help.parseThread({ id: "t1", reference: "KK-HLP-ABC123", status: "under_review", outcome: null, unread: true, messages: [{ id: "a", sender: "reporter", text: "Hi", at: "2030-01-01T10:00:00Z" }, { id: "b", sender: "support", text: "Hello!", at: "2030-01-01T10:05:00Z" }] });
    assert.deepEqual([t.reference, t.status, t.unread, t.messages.map(m => m.sender)], ["KK-HLP-ABC123", "under_review", true, ["you", "support"]]);
    assert.equal(help.parseThread({ id: "t2", reference: "R", status: "resolved", outcome: "Sorted.", unread: false, messages: [] }).outcome, "Sorted.");
    assert.equal(help.parseThread(null), null);
    for (const bad of [{}, { id: "t", reference: "r", status: "weird", messages: [] }, { id: "t", reference: "r", status: "received", messages: [{ id: "a", sender: "x", text: "y" }] }, { id: "t", reference: "r", status: "received", messages: [{ id: "a", sender: "support", text: "y" }, { id: "a", sender: "support", text: "z" }] }]) assert.throws(() => help.parseThread(bad));
    assert.deepEqual([help.helpKind("feedback"), help.helpKind("anything"), help.helpKind(undefined)], ["feedback", "help", "help"]);
  });
  await check("Writing to support is trimmed, keyed so a retry saves once, and an empty message never leaves the app", async () => {
    const thread = { id: "t1", reference: "KK-HLP-1", status: "received", outcome: null, unread: false, messages: [{ id: "a", sender: "reporter", text: "Help", at: "2030-01-01T10:00:00Z" }] };
    const c = client({ sendHelpMessage: thread });
    const out = await help.sendHelp(c, "u1", "help", "  Help  ");
    assert.deepEqual([c.calls[0].variables.kind, c.calls[0].variables.text, typeof c.calls[0].variables.idempotencyKey, out.messages.length], ["help", "Help", "string", 1]);
    await assert.rejects(help.sendHelp(c, "u1", "help", "   "), /Write a message first/);
    await assert.rejects(help.sendHelp(c, "u1", "help", "x".repeat(1001)), /1,000/);
    const down = client(new Error("Network request failed"));
    await assert.rejects(help.sendHelp(down, "u2", "feedback", "again")); await assert.rejects(help.sendHelp(down, "u2", "feedback", "again"));
    assert.equal(down.calls[0].variables.idempotencyKey, down.calls[1].variables.idempotencyKey);
    assert.deepEqual(help.LEGAL_LINKS, { terms: "https://kraftkonect.com/terms", privacy: "https://kraftkonect.com/privacy" });
  });
  await check("Provider services, availability and work photos send exactly what the server expects", async () => {
    const draft = { title: " Pipe repair ", description: " Fixes leaks ", price: "5,000", photos: ["https://res.cloudinary.com/x/a.jpg", "file:///local.jpg"] };
    const c = client({ saveMyService: { id: "s1", active: true } });
    assert.equal(await manage.saveService(c, "u1", undefined, draft), "s1");
    assert.deepEqual(c.calls[0].variables, { id: null, input: { title: "Pipe repair", description: "Fixes leaks", priceCents: 500000, photos: ["https://res.cloudinary.com/x/a.jpg"] } });
    assert.equal(c.calls[0].context.accountOwnerId, "u1");
    await assert.rejects(manage.saveService(c, "u1", "s1", { ...draft, price: "0" }), /valid starting price/);
    await assert.rejects(manage.saveService(client({ saveMyService: null }), "u1", "s1", draft), /did not confirm/);
    await assert.rejects(manage.saveService(client(apollo(400, "You can list up to 20 services.")), "u1", undefined, draft), /up to 20/);
    await assert.rejects(manage.removeService(client({ removeMyService: false }), "u1", "s1"), /did not confirm/);
    await manage.removeService(client({ removeMyService: true }), "u1", "s1");
    assert.deepEqual(manage.parseAvailability({ available: true, requestDays: [] }).days, [0, 1, 2, 3, 4, 5, 6]);
    assert.deepEqual(manage.parseAvailability({ available: false, requestDays: [] }), { available: false, days: [] });
    assert.deepEqual(manage.parseAvailability({ available: true, requestDays: [5, 1, 1] }).days, [1, 5]);
    assert.throws(() => manage.parseAvailability({ available: true, requestDays: [9] }));
    assert.throws(() => manage.parseAvailability(null));
    const a = client({ setMyAvailability: { available: true, days: [1, 2] } });
    assert.deepEqual(await manage.saveAvailability(a, "u1", { available: true, days: [1, 2] }), { available: true, days: [1, 2] });
    assert.deepEqual(a.calls[0].variables, { available: true, days: [1, 2] });
    assert.deepEqual(await manage.saveWorkPhotos(client({ saveMyWorkPhotos: ["https://res.cloudinary.com/x/a.jpg"] }), "u1", ["https://res.cloudinary.com/x/a.jpg"]), ["https://res.cloudinary.com/x/a.jpg"]);
    await assert.rejects(manage.saveWorkPhotos(client(apollo(400, "Add up to 12 photos.")), "u1", []), /up to 12/);
  });
  console.log(count + " live settings checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
