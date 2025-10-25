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

// netlify/functions/llm-chat.ts
var llm_chat_exports = {};
__export(llm_chat_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(llm_chat_exports);
var handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { messages, forceJson, model } = JSON.parse(event.body || "{}");
    if (!Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, body: "messages required" };
    }
    const apiKey = process.env.COHERE_API_KEY || process.env.LLM_API_KEY || "";
    const baseUrl = process.env.LLM_BASE_URL || "https://api.cohere.ai/v1";
    const mdl = model || process.env.LLM_MODEL || "command-light";
    if (!apiKey) {
      return { statusCode: 500, body: "Missing COHERE_API_KEY/LLM_API_KEY" };
    }
    const last = messages[messages.length - 1];
    const chat_history = messages.slice(0, -1).map((m) => ({ role: m.role === "user" ? "USER" : "CHATBOT", message: m.content }));
    const res = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: mdl, message: last.content, chat_history, temperature: 0.2, ...forceJson ? { response_format: { type: "json_object" } } : {} })
    });
    if (!res.ok) {
      return { statusCode: res.status, body: await res.text() };
    }
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify({ text: data.text || "", raw: data }) };
  } catch (e) {
    return { statusCode: 500, body: e?.message || "server error" };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=llm-chat.js.map
