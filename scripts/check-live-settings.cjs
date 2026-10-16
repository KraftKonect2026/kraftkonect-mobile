// Fast checks for the account settings adapters (no backend needed).
const assert = require("node:assert/strict"), load = require("./load-typescript.cjs");
const prefs = load("lib/account/livePrefs.ts");
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
  console.log(count + " live settings checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
