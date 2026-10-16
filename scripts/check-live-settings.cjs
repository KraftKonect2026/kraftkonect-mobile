// Fast checks for the account settings adapters (no backend needed).
const assert = require("node:assert/strict"), load = require("./load-typescript.cjs");
const prefs = load("lib/account/livePrefs.ts"), contact = load("lib/account/liveContact.ts"), acct = load("lib/account/liveAccount.ts"), help = load("lib/support/liveHelp.ts"), manage = load("lib/provider/liveManage.ts"), report = load("lib/provider/liveReport.ts"), cards = load("lib/payments/liveCards.ts"), history = load("lib/account/liveHistory.ts");
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
  await check("The earnings report asks the server for exactly the chosen period and refuses figures that do not add up", async () => {
    const good = { labourMinor: 650000, materialsMinor: 300000, inspectionMinor: 0, netReleasedMinor: 950000, grossPaidMinor: 1000000, feeMinor: 50000, jobsCount: 1 };
    const c = client({ myEarningsReport: good });
    const r = await report.loadReport(c, "u1", "Month", 0, new Date(2026, 2, 15));
    assert.deepEqual([r.netReleased, r.fee, r.jobs, r.label], [950000, 50000, 1, "March 2026"]);
    assert.deepEqual(c.calls[0].variables, { from: new Date(2026, 2, 1).toISOString(), to: new Date(2026, 3, 1).toISOString() });
    assert.equal(c.calls[0].context.accountOwnerId, "u1");
    const prev = client({ myEarningsReport: good }); await report.loadReport(prev, "u1", "Month", -1, new Date(2026, 2, 15));
    assert.equal(prev.calls[0].variables.from, new Date(2026, 1, 1).toISOString());
    const all = client({ myEarningsReport: good }); await report.loadReport(all, "u1", "All time", 0);
    assert.deepEqual(all.calls[0].variables, {});
    await assert.rejects(report.loadReport(client({ myEarningsReport: { ...good, netReleasedMinor: 1 } }), "u1", "Year", 0), /did not add up/);
    await assert.rejects(report.loadReport(client({ myEarningsReport: null }), "u1", "Year", 0), /could not be read/);
    await assert.rejects(report.loadReport(client(apollo(403, "Only providers have an earnings report.")), "u1", "Year", 0), /Only providers/);
  });
  await check("Saved cards: only brand, last four digits and expiry are read; adding opens only a secure address; removal returns the server's list", async () => {
    const raw = { id: "c1", brand: "visa", last4: "4081", expMonth: "2", expYear: "2030", bank: "TEST BANK", expired: false, authorizationCode: "AUTH_SECRET" };
    const list = cards.parseCards([raw]);
    assert.deepEqual(list[0], { id: "c1", brand: "visa", last4: "4081", expMonth: "2", expYear: "2030", bank: "TEST BANK", expired: false });
    assert.equal(cards.cardLabel(list[0]), "Visa •••• 4081 · 02/30");
    assert.equal(cards.cardLabel({ ...list[0], brand: null, expMonth: null }), "Card •••• 4081");
    for (const bad of [null, [{}], [{ id: "x", last4: "12" }], [{ id: "", last4: "1234" }]]) assert.throws(() => cards.parseCards(bad));
    const c = client({ mySavedCards: [raw] });
    assert.equal((await cards.loadCards(c, "u1"))[0].last4, "4081"); assert.equal(c.calls[0].context.accountOwnerId, "u1");
    assert.deepEqual(await cards.startAddCard(client({ startAddCard: { reference: "KK-CRD-1", authorizationUrl: "https://checkout.paystack.test/KK-CRD-1" } }), "u1"), { reference: "KK-CRD-1", url: "https://checkout.paystack.test/KK-CRD-1" });
    await assert.rejects(cards.startAddCard(client({ startAddCard: { reference: "KK-CRD-1", authorizationUrl: "http://insecure.test" } }), "u1"), /secure card page/);
    await assert.rejects(cards.startAddCard(client(apollo(409, "You can keep up to 5 cards. Remove one to add another.")), "u1"), /up to 5 cards/);
    const done = await cards.verifyCardSetup(client({ verifyCardSetup: { saved: true, status: "done", cards: [raw] } }), "u1", "KK-CRD-1");
    assert.deepEqual([done.saved, done.status, done.cards.length], [true, "done", 1]);
    await assert.rejects(cards.verifyCardSetup(client({ verifyCardSetup: { saved: true, status: "weird", cards: [] } }), "u1", "r"), /did not confirm/);
    assert.deepEqual(await cards.removeCard(client({ removeSavedCard: [] }), "u1", "c1"), []);
    await assert.rejects(cards.removeCard(client(apollo(404, "That card was not found.")), "u1", "zz"), /not found/);
    cards.paymentChoice.set({ cardId: "c1", saveCard: true });
    assert.deepEqual(cards.paymentChoice.get(), { cardId: "c1", saveCard: false }, "saving only applies to a new card");
    cards.paymentChoice.set({ cardId: null, saveCard: true }); assert.equal(cards.paymentChoice.get().saveCard, true);
    cards.paymentChoice.reset(); assert.deepEqual(cards.paymentChoice.get(), { cardId: null, saveCard: false });
  });
  await check("Payment history and my reviews read exactly what the server sends and refuse anything malformed", async () => {
    const pay = { id: "p1", kind: "deposit", title: "Inspection deposit · Sink repair", amountMinor: 500000, status: "paid", at: "2026-03-01T12:00:00.000Z", bookingId: "b1", reference: "KK-DEP-1" };
    const c = client({ myPaymentHistory: [pay, { ...pay, id: "p2", kind: "refund", status: "refunded" }] });
    const list = await history.loadPayments(c, "u1");
    assert.deepEqual([list.length, list[1].kind, history.paymentStatusLabel(list[1].status), c.calls[0].context.accountOwnerId], [2, "refund", "Refunded", "u1"]);
    assert.equal(history.paymentStatusLabel("something-new"), "Unknown");
    for (const bad of [null, [{ ...pay, kind: "gift" }], [{ ...pay, amountMinor: -5 }], [{ ...pay, at: "never" }], [{}]]) assert.throws(() => history.parsePayments(bad));
    assert.deepEqual(history.parsePayments([]), []);
    const rev = { id: "r1", bookingId: "b1", providerName: "Pat", serviceTitle: "Sink repair", rating: 4, text: "Tidy work.", createdAt: "2026-03-02T10:00:00.000Z" };
    assert.equal((await history.loadReviews(client({ myReviews: [rev] }), "u1"))[0].providerName, "Pat");
    for (const bad of [null, [{ ...rev, rating: 9 }], [{ ...rev, rating: 3.5 }], [{ ...rev, text: 5 }]]) assert.throws(() => history.parseReviews(bad));
    await assert.rejects(history.loadPayments(client(apollo(401, "Not authenticated")), "u1"), /Not authenticated/);
  });
  console.log(count + " live settings checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
