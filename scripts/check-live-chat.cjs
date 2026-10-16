// Fast checks for sending in a conversation (no backend needed).
const assert = require("node:assert/strict"), load = require("./load-typescript.cjs");
const c = load("lib/messaging/liveChat.ts"), m = load("lib/messaging/liveMessages.ts");
let count = 0;
async function check(name, run) { await run(); count++; console.log("PASS " + name); }
const client = result => { const calls = []; return { calls, mutate: async o => { calls.push(o); if (result instanceof Error) throw result; return { data: result }; } }; };
const apollo = (status, message) => Object.assign(new Error("Response not successful: Received status code " + status), { networkError: { result: { errors: [{ message }] } } });
const ok = { sendChatMessage: { id: "m1" } };

(async () => {
  await check("A message goes to the conversation, trimmed, with a key; the recipient is never sent", async () => {
    const cl = client(ok);
    await c.sendChat(cl, "u1", "conv1", "  Hello there  ");
    const v = cl.calls[0].variables;
    assert.deepEqual([v.conversationId, v.text, v.attachmentUrl, typeof v.idempotencyKey], ["conv1", "Hello there", null, "string"]);
    assert.equal(cl.calls[0].context.accountOwnerId, "u1"); assert.equal("recipientId" in v, false);
  });
  await check("A photo goes with or without words; only secure addresses are sent; an empty message never leaves the app", async () => {
    const cl = client(ok);
    await c.sendChat(cl, "u1", "conv1", "", "https://res.cloudinary.com/x/y.jpg");
    assert.deepEqual([cl.calls[0].variables.text, cl.calls[0].variables.attachmentUrl], [null, "https://res.cloudinary.com/x/y.jpg"]);
    await c.sendChat(cl, "u1", "conv1", "see", "http://insecure.example/y.jpg");
    assert.equal(cl.calls[1].variables.attachmentUrl, null);
    await assert.rejects(c.sendChat(cl, "u1", "conv1", "   "), /Write a message or add a photo/);
    await assert.rejects(c.sendChat(cl, "u1", "conv1", "x".repeat(1001)), /1,000/);
    assert.equal(cl.calls.length, 2);
  });
  await check("A dropped connection retries with the same key; a refusal or a success starts fresh", async () => {
    const down = client(new Error("Network request failed"));
    await assert.rejects(c.sendChat(down, "u2", "conv1", "again"), /Network/); await assert.rejects(c.sendChat(down, "u2", "conv1", "again"), /Network/);
    assert.equal(down.calls[0].variables.idempotencyKey, down.calls[1].variables.idempotencyKey);
    const refused = client(apollo(409, "This person is no longer on KraftKonect, so you can’t message them."));
    await assert.rejects(c.sendChat(refused, "u3", "conv1", "hi"), /no longer on KraftKonect/); await assert.rejects(c.sendChat(refused, "u3", "conv1", "hi"), /no longer/);
    assert.notEqual(refused.calls[0].variables.idempotencyKey, refused.calls[1].variables.idempotencyKey);
    const good = client(ok); await c.sendChat(good, "u4", "conv1", "same"); await c.sendChat(good, "u4", "conv1", "same");
    assert.notEqual(good.calls[0].variables.idempotencyKey, good.calls[1].variables.idempotencyKey);
    await assert.rejects(c.sendChat(client({ sendChatMessage: null }), "u5", "conv1", "x"), /did not confirm/);
  });
  await check("Reading a conversation accepts photos, with or without words, and still rejects an empty message", () => {
    const conv = { id: "conv1", ownerId: "u1", recipientId: "u2", name: "Pat", service: "x", unread: 0 };
    const row = over => ({ id: "m" + Math.random(), conversationId: "conv1", senderId: "u2", recipientId: "u1", text: "hi", read: false, createdAt: "2030-01-01T10:00:00Z", attachmentUrl: null, ...over });
    const out = m.ownedLiveMessages("u1", conv, [row({ text: "", attachmentUrl: "https://res.cloudinary.com/x/y.jpg" }), row({ text: "with words", attachmentUrl: "https://res.cloudinary.com/x/z.jpg" }), row()]);
    assert.deepEqual(out.map(x => [x.text, x.photoUrl]), [["", "https://res.cloudinary.com/x/y.jpg"], ["with words", "https://res.cloudinary.com/x/z.jpg"], ["hi", undefined]]);
    assert.throws(() => m.ownedLiveMessages("u1", conv, [row({ text: "", attachmentUrl: null })]), /could not be loaded/);
    assert.throws(() => m.ownedLiveMessages("u1", conv, [row({ text: "", attachmentUrl: "javascript:alert(1)" })]));
  });
  await check("Marking a conversation read is scoped to the signed-in account", async () => {
    const cl = client({ markConversationRead: true });
    await c.markRead(cl, "u1", "conv1");
    assert.deepEqual([cl.calls[0].variables, cl.calls[0].context.accountOwnerId], [{ conversationId: "conv1" }, "u1"]);
    await assert.rejects(c.markRead(client(apollo(403, "Not authorized to use this conversation")), "u1", "conv1"), /Not authorized/);
  });
  console.log(count + " live chat checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
