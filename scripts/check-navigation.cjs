const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const modules = new Map();
function loadSource(relative) {
  const full = path.join(root, relative);
  if (modules.has(full)) return modules.get(full).exports;
  const compiled = ts.transpileModule(fs.readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = new Module(full, module);
  mod.filename = full;
  mod.paths = Module._nodeModulePaths(path.dirname(full));
  const originalRequire = mod.require.bind(mod);
  mod.require = spec => spec === "@/lib/appMode" ? loadSource("lib/appMode.ts") : originalRequire(spec);
  modules.set(full, mod);
  mod._compile(compiled, full);
  return mod.exports;
}
const auth = loadSource("store/authSlice.ts");
const { resolveAppMode, homeForMode } = loadSource("lib/appMode.ts");
const { providerStage, partitionJobs, toHomeJob } = loadSource("lib/homeData.ts");
const reducer = auth.default;
const user = (id, role) => ({ id, role, email: id + "@example.test", name: "Test account" });
const signedIn = account => reducer(reducer(reducer(undefined, auth.setUser(account)), auth.setTokens({ accessToken: "test-access", refreshToken: "test-refresh" })), auth.setIsAuthenticated(true));
let count = 0;
function check(name, fn) { fn(); count++; console.log("PASS " + name); }
check("Older provider sessions keep their landing route during migration", () => assert.equal(resolveAppMode({ user: user("old", "provider") }), "provider"));
check("Switching mode preserves identity, server role and tokens", () => {
  const before = signedIn(user("one", "customer"));
  const after = reducer(before, auth.setActiveMode("provider"));
  assert.deepEqual(after.user, before.user);
  assert.equal(after.accessToken, before.accessToken);
  assert.equal(after.refreshToken, before.refreshToken);
  assert.equal(resolveAppMode(after), "provider");
});
check("Mode preference survives a same-account session renewal", () => {
  let state = reducer(signedIn(user("one", "provider")), auth.setActiveMode("customer"));
  state = reducer(state, auth.signOut());
  assert.equal(state.accessToken, null);
  assert.equal(state.isAuthenticated, false);
  state = reducer(state, auth.setUser(user("one", "provider")));
  assert.equal(resolveAppMode(state), "customer");
});
check("Another account does not inherit the previous account's mode", () => {
  let state = reducer(signedIn(user("one", "customer")), auth.setActiveMode("provider"));
  state = reducer(state, auth.signOut());
  state = reducer(state, auth.setUser(user("two", "customer")));
  assert.equal(resolveAppMode(state), "customer");
  assert.equal(state.modeAccountId, "two");
});
check("Server approval updates do not unexpectedly switch views", () => {
  let state = signedIn(user("one", "customer"));
  state = reducer(state, auth.setActiveMode("customer"));
  state = reducer(state, auth.updateUser({ role: "provider" }));
  assert.equal(resolveAppMode(state), "customer");
});
check("Signed-out mode changes cannot create a session", () => {
  const before = reducer(undefined, { type: "init" });
  assert.deepEqual(reducer(before, auth.setActiveMode("provider")), before);
});
check("Forgetting an account clears its selected mode", () => {
  const state = reducer(signedIn(user("one", "provider")), auth.forgetLastAccount());
  assert.equal(state.activeMode, null);
  assert.equal(state.modeAccountId, null);
});
check("An unrelated persisted owner is never used for routing", () => assert.equal(resolveAppMode({ user: user("two", "customer"), modeAccountId: "one", activeMode: "provider" }), "customer"));
check("Both modes resolve to existing Home destinations", () => {
  assert.equal(homeForMode("customer"), "/(app)/(tabs)");
  assert.equal(homeForMode("provider"), "/provider/(tabs)/today");
});
check("Missing provider data means setup, not approval", () => assert.equal(providerStage(null, false), "setup"));
check("Pending identity and missing service never imply listing readiness", () => {
  assert.equal(providerStage({ id: "p", status: "pending", kycStatus: "pending" }, true), "pending");
  assert.equal(providerStage({ id: "p", status: "pending", kycStatus: "pending" }, false), "setup");
  assert.notEqual(providerStage({ id: "p", status: "approved", kycStatus: null }, true), "ready");
});
check("Rejected identity needs attention", () => assert.equal(providerStage({ id: "p", status: "approved", kycStatus: "declined" }, true), "changes"));
check("Approved providers retain Home after deleting their last service", () => assert.equal(providerStage({ id: "p", status: "approved", kycStatus: "approved" }, false), "ready"));
check("Requests, active and terminal records remain separated", () => {
  const data = ["pending", "confirmed", "in_progress", "completed", "cancelled", "refunded", "unknown"].map((status, i) => ({ id: i, status }));
  const groups = partitionJobs(data);
  assert.deepEqual(groups.requests.map(b => b.status), ["pending"]);
  assert.deepEqual(groups.active.map(b => b.status), ["confirmed", "in_progress"]);
  assert.deepEqual(groups.completed.map(b => b.status), ["completed"]);
  assert.deepEqual(groups.cancelled.map(b => b.status), ["cancelled", "refunded"]);
});
check("Missing appointment data is not filled with Figma examples", () => {
  const job = toHomeJob({ id: "booking", status: "confirmed", bookingDate: "invalid" });
  assert.equal(job.address, undefined);
  assert.equal(job.image, undefined);
  assert.equal(job.date, "Date to be confirmed");
});
console.log("\nNavigation/account regression checks passed: " + count + ".");
