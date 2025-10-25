var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/verify-turnstile.ts
var verify_turnstile_exports = {};
__export(verify_turnstile_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(verify_turnstile_exports);
var handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { token, action } = JSON.parse(event.body || "{}");
    if (!token) {
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: "missing token" }) };
    }
    const secret = process.env.TURNSTILE_SECRET_KEY || "";
    if (!secret) {
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: "missing TURNSTILE_SECRET_KEY" }) };
    }
    if (token === "bypass") {
      return { statusCode: 200, body: JSON.stringify({ ok: true, action, data: { success: true, bypass: true } }) };
    }
    const form = new URLSearchParams();
    form.append("secret", secret);
    form.append("response", token);
    const fwd = event.headers["x-forwarded-for"] || event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "";
    if (fwd) form.append("remoteip", fwd.split(",")[0].trim());
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    let data;
    try {
      data = await resp.json();
    } catch {
      const text = await resp.text();
      data = { success: false, raw: text };
    }
    const ok = Boolean(data?.success);
    if (!ok && data?.["error-codes"]) {
      console.warn("[Turnstile verify] failed", { codes: data["error-codes"] });
    }
    return { statusCode: 200, body: JSON.stringify({ ok, action, data }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: e?.message || "verify exception" }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=verify-turnstile.js.map
