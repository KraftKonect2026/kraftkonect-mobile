const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(path.dirname(module.filename), "..");
const modules = new Map();
function loadSource(relative) {
  const full = path.join(root, relative);
  if (modules.has(full)) return modules.get(full).exports;
  const compiled = ts.transpileModule(fs.readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = new Module(full, module);
  mod.filename = full;
  mod.paths = Module._nodeModulePaths(path.dirname(full));
  const originalRequire = mod.require.bind(mod);
  mod.require = spec => spec.startsWith("@/") ? loadSource(spec.slice(2) + ".ts") : originalRequire(spec);
  modules.set(full, mod);
  mod._compile(compiled, full);
  return mod.exports;
}
const { emptyDraft, safeDraft, draftForAccount, nextAfterPhone, normalizedPhone, maskedPhone, validName, priceCents, draftKey, areaKey, stepAllowed } = loadSource("lib/onboarding/model.ts");
const { confirmedPhoneSession, authFailure, authMessage } = loadSource("lib/onboarding/phoneAuth.ts");
const auth = loadSource("store/authSlice.ts");
const testLogin = loadSource("lib/onboarding/testLogin.ts");
let count = 0;
function check(name, fn) { fn(); count++; console.log("PASS " + name); }
const phone = "+2348012345678";
const proof = { accessToken: "server-access", refreshToken: "server-refresh", user: { id: "stable-account", role: "customer", phone } };
check("National, local and pasted international phone formats normalize consistently", () => {
  for (const value of ["8012345678", "0801 234 5678", "+234 801 234 5678", "2348012345678", "(0801)-234-5678"]) assert.equal(normalizedPhone(value), phone);
  for (const value of ["", "801234567", "80123456789", "+18012345678", "6012345678", "801ABC5678", "801.234.5678"]) assert.equal(normalizedPhone(value), null);
  assert.equal(maskedPhone(phone), "+234 ••• ••• 5678");
});
check("Unicode names are accepted and empty/control/oversized names are rejected", () => {
  assert.equal(validName(" Ọlá "), true); assert.equal(validName("Jean-Luc"), true);
  for (const value of ["   ", "Peter\nPan", "x".repeat(61)]) assert.equal(validName(value), false);
});
check("Naira prices preserve exact minor units, commas and GraphQL integer limits", () => {
  for (const [value, cents] of [["15,000",1500000], ["1.05",105], ["0.01",1], ["21474836.47",2147483647]]) assert.equal(priceCents(value), cents);
  for (const value of ["0", "-1", "1e3", "NaN", "10.001", "1,50", "15,00", "21474836.48", "99999999999999999999"]) assert.equal(priceCents(value), null);
});
check("Saved drafts whitelist public fields and never contain credentials or private ID documents", () => {
  const saved = safeDraft({ ...emptyDraft(), businessName: "Local business", otp: "123456", pinId: "secret", accessToken: "secret", idUrl: "private", selfieUrl: "private", verified: true });
  assert.equal(saved.businessName, "Local business");
  for (const key of ["otp","pinId","accessToken","idUrl","selfieUrl","verified"]) assert.equal(key in saved, false);
});
check("Restored OTP and success screens require fresh proof", () => {
  for (const [before, after] of [["phone-code","phone"],["sign-in-code","sign-in"],["account-missing","sign-in"],["complete","first-service"],["verification-pending","first-service"]]) assert.equal(safeDraft({ resumeStep: before }).resumeStep, after);
});
check("Malformed days/photos are bounded and a corrupt draft remains usable", () => {
  assert.deepEqual(safeDraft({ workingDays: [1,1,0,7,-1,"2",2.5], gallery: [3,...Array(10).fill("photo")] }).workingDays, [1,0]);
  assert.equal(safeDraft({ gallery: Array(20).fill("photo") }).gallery.length, 8);
  assert.deepEqual(safeDraft(null), emptyDraft());
});
check("Account-specific keys satisfy native SecureStore and cannot collide with previews", () => {
  const owners = ["account/a-b", "account/a/b", "account/a_b", "account/😀", "preview/step4", "registration"];
  const keys = owners.map(draftKey);
  assert.equal(new Set(keys).size, owners.length);
  keys.forEach(key => assert.match(key, /^[A-Za-z0-9._-]+$/));
  assert.notEqual(areaKey("a"), draftKey("account/a"));
});
check("Returning to registration preserves the verified account's existing provider draft", () => {
  const saved = { ...emptyDraft(), mode: "provider", resumeStep: "gallery", businessName: "Saved business", avatar: "saved-photo", workingDays: [1,3] };
  const bound = draftForAccount({ ...emptyDraft(), mode: "provider", phone }, saved);
  assert.equal(bound.businessName, "Saved business"); assert.equal(bound.avatar, "saved-photo");
  assert.deepEqual(bound.workingDays, [1,3]); assert.equal(nextAfterPhone(bound, true), "gallery");
  assert.equal(nextAfterPhone(bound, false), "name");
  assert.equal(nextAfterPhone({ ...bound, mode: "customer" }, true), "location");
});
check("An anonymous deep link cannot skip phone verification", () => {
  for (const step of ["name","profile","first-service","complete","verification-pending"]) assert.equal(stepAllowed(step, false, false), "phone");
  assert.equal(stepAllowed("profile", true, false), "profile"); assert.equal(stepAllowed("profile", false, true), "profile");
});
check("Customer matching preferences never overwrite the provider's service area", () => {
  const provider = { ...emptyDraft(), mode: "provider", area: "Lekki, Lagos", customerArea: "Ikeja, Lagos" };
  const customer = draftForAccount({ ...emptyDraft(), mode: "customer", phone }, provider);
  assert.equal(customer.area, "Lekki, Lagos"); assert.equal(customer.customerArea, "Ikeja, Lagos");
  const changed = safeDraft({ ...customer, customerArea: "Yaba, Lagos" });
  assert.equal(changed.area, "Lekki, Lagos"); assert.equal(changed.customerArea, "Yaba, Lagos");
});
check("Partial or mismatched API responses cannot establish a session", () => {
  for (const bad of [null, {}, { ...proof, accessToken: " " }, { ...proof, refreshToken: null }, { ...proof, user: { ...proof.user, id: "" } }, { ...proof, user: { ...proof.user, role: "invented" } }, { ...proof, user: { ...proof.user, phone: "+2349012345678" } }]) assert.throws(() => confirmedPhoneSession(bad, phone));
});
check("Verified sessions preserve server identity and role, including legacy phone formatting", () => {
  const session = confirmedPhoneSession({ ...proof, user: { ...proof.user, phone: "08012345678", role: "provider" } }, phone);
  assert.equal(session.user.id, proof.user.id); assert.equal(session.user.role, "provider");
  assert.equal(session.accessToken, proof.accessToken); assert.equal(session.user.phoneVerified, true);
});
check("Network failures never become account-not-found or invalid-code claims", () => {
  assert.equal(authFailure(new Error("Account not found")), "unavailable");
  for (const [code, expected] of [["ACCOUNT_NOT_FOUND","account-missing"],["OTP_EXPIRED","expired"],["INVALID_OTP","invalid"],["INTERNAL_SERVER_ERROR","unavailable"]]) assert.equal(authFailure({ graphQLErrors: [{ extensions: { code } }] }), expected);
});
check("The server's real HTTP errors (404/400/429/403) are understood from the response body too", () => {
  const body = (code, message = "x") => ({ networkError: { result: { errors: [{ message, extensions: { code } }] } } });
  for (const [code, expected] of [["ACCOUNT_NOT_FOUND","account-missing"],["OTP_EXPIRED","expired"],["OTP_INVALID","invalid"],["RATE_LIMITED","rate-limited"],["FORBIDDEN","blocked"],["BAD_REQUEST","unavailable"]]) assert.equal(authFailure(body(code)), expected, code);
  assert.equal(authMessage(body("RATE_LIMITED", "Please wait a minute before asking for another code.")), "Please wait a minute before asking for another code.");
  assert.equal(authMessage(body("FORBIDDEN", "This account is not active. Contact support.")), "This account is not active. Contact support.");
  assert.equal(authMessage(body("OTP_INVALID", "That code doesn’t match.")), undefined, "only the cases that need the server's words use them");
  assert.equal(authMessage(new Error("x")), undefined);
});
check("Remembered phone survives sign-out and never leaks into another account", () => {
  let state = auth.default(undefined, auth.setUser(proof.user));
  state = auth.default(state, auth.signOut()); assert.equal(state.lastPhone, phone);
  state = auth.default(state, auth.setUser({ id: "other", role: "customer" })); assert.equal(state.lastPhone, null);
  state = auth.default(auth.default(undefined, auth.setUser(proof.user)), auth.forgetLastAccount()); assert.equal(state.lastPhone, null);
});
check("Only the dedicated test phone can request a development challenge", () => {
  for (const value of ["8000000000", "0800 000 0000", "+2348000000000", "2348000000000"]) assert.equal(testLogin.isTestLoginPhone(value, true), true);
  for (const value of [phone, "8000000001", "", "+18000000000"]) {
    assert.equal(testLogin.isTestLoginPhone(value, true), false);
    assert.throws(() => testLogin.createTestLoginChallenge(value, true, 1000));
  }
});
check("Production rejects both requesting and verifying local test credentials", () => {
  const challenge = testLogin.createTestLoginChallenge(testLogin.testLoginPhone, true, 1000);
  assert.equal(testLogin.isTestLoginPhone(testLogin.testLoginPhone, false), false);
  assert.throws(() => testLogin.createTestLoginChallenge(testLogin.testLoginPhone, false, 1000));
  assert.equal(testLogin.checkTestLoginCode(challenge, challenge.phone, testLogin.testLoginCode, false, 1001), "invalid");
});
check("Test code is bound to the requested phone and rejects incorrect codes", () => {
  const challenge = testLogin.createTestLoginChallenge(testLogin.testLoginPhone, true, 1000);
  assert.equal(testLogin.checkTestLoginCode(challenge, "08000000000", testLogin.testLoginCode, true, 1001), "valid");
  for (const code of ["654321", "12345", "1234567", " 123456"]) assert.equal(testLogin.checkTestLoginCode(challenge, challenge.phone, code, true, 1001), "invalid");
  assert.equal(testLogin.checkTestLoginCode(challenge, phone, testLogin.testLoginCode, true, 1001), "invalid");
  assert.equal(testLogin.checkTestLoginCode({ ...challenge, phone }, challenge.phone, testLogin.testLoginCode, true, 1001), "invalid");
});
check("Expired test challenges require a new request; malformed clocks cannot grant access", () => {
  const challenge = testLogin.createTestLoginChallenge(testLogin.testLoginPhone, true, 1000);
  assert.equal(testLogin.checkTestLoginCode(challenge, challenge.phone, testLogin.testLoginCode, true, challenge.expiresAt - 1), "valid");
  for (const now of [challenge.expiresAt, challenge.expiresAt + 1, NaN]) assert.equal(testLogin.checkTestLoginCode(challenge, challenge.phone, testLogin.testLoginCode, true, now), "expired");
  assert.throws(() => testLogin.createTestLoginChallenge(testLogin.testLoginPhone, true, NaN));
  assert.equal(testLogin.checkTestLoginCode({ ...challenge, expiresAt: NaN }, challenge.phone, testLogin.testLoginCode, true, 1001), "expired");
});
console.log("\nOnboarding/auth regression checks passed: " + count + ".");
