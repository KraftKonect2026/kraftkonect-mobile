// Fast checks for the notification list adapter (no backend needed).
const assert = require("node:assert/strict"), load = require("./load-typescript.cjs");
const n = load("lib/notifications/liveInbox.ts");
let count = 0;
async function check(name, run) { await run(); count++; console.log("PASS " + name); }
const item = (over = {}) => ({ id: "i" + Math.random(), title: "Request update", body: "Your provider has responded.", linkType: "booking", linkId: "b1", createdAt: "2030-01-05T10:00:00Z", read: false, ...over });
const client = result => { const calls = []; return { calls, query: async o => { calls.push(o); if (result instanceof Error) throw result; return { data: result }; }, mutate: async o => { calls.push(o); return { data: { markInboxRead: 1 } }; } }; };

(async () => {
  await check("The list maps to what the screen shows, with a link only for kinds the app can open", () => {
    const page = n.parseInbox({ unreadCount: 2, items: [item({ id: "a" }), item({ id: "b", linkType: "conversation", linkId: "c1", read: true }), item({ id: "c", linkType: "payout", linkId: "p1" }), item({ id: "d", linkType: "something_new" }), item({ id: "e", linkType: null, linkId: null })] });
    assert.equal(page.unread, 2);
    assert.deepEqual(page.items.map(i => [i.id, i.read, i.link?.type]), [["a", false, "booking"], ["b", true, "conversation"], ["c", false, "payout"], ["d", false, undefined], ["e", false, undefined]]);
  });
  await check("Unreliable data is rejected instead of shown", () => {
    for (const bad of [null, {}, { unreadCount: -1, items: [] }, { unreadCount: 1.5, items: [] }, { unreadCount: 0, items: [item({ id: "x" }), item({ id: "x" })] }, { unreadCount: 0, items: [item({ createdAt: "not a date" })] }, { unreadCount: 0, items: [item({ title: null })] }]) assert.throws(() => n.parseInbox(bad));
  });
  await check("Loading is scoped to the signed-in account and pages by the oldest date; reading names what was read", async () => {
    const c = client({ myInbox: { unreadCount: 0, items: [] } });
    await n.loadInbox(c, "u1", "2030-01-01T00:00:00Z");
    assert.deepEqual([c.calls[0].variables, c.calls[0].context.accountOwnerId], [{ limit: 30, before: "2030-01-01T00:00:00Z" }, "u1"]);
    await n.markInboxRead(c, "u1", ["a", "b"]); await n.markInboxRead(c, "u1", "all");
    assert.deepEqual([c.calls[1].variables, c.calls[2].variables], [{ ids: ["a", "b"] }, { all: true }]);
    await assert.rejects(n.loadInbox(client(new Error("Network request failed")), "u1"), /Network request failed/);
  });
  await check("Items are grouped into today and earlier, and times read in Lagos time", () => {
    const now = new Date("2030-01-05T18:00:00Z");
    assert.equal(n.dayGroup("2030-01-05T09:00:00Z", now), "Today"); assert.equal(n.dayGroup("2030-01-03T09:00:00Z", now), "Earlier");
    assert.match(n.whenLabel("2030-01-05T09:30:00Z", now), /10:30/); assert.match(n.whenLabel("2030-01-03T09:30:00Z", now), /3 Jan/);
  });
  console.log(count + " live inbox checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
