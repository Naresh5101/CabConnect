import assert from "node:assert/strict";
import test from "node:test";
import { corsHeadersForOrigin, isAllowedOrigin } from "./cors.js";

test("allows local Vite origins and configured production origins", () => {
  assert.equal(isAllowedOrigin("http://127.0.0.1:5173"), true);
  assert.equal(isAllowedOrigin("http://localhost:5174"), true);
  assert.equal(isAllowedOrigin("https://cabconnect.example", "https://cabconnect.example, https://preview.example"), true);
});

test("sets the requesting origin for approved CORS requests and rejects unknown origins", () => {
  assert.equal(corsHeadersForOrigin("http://127.0.0.1:5173")["Access-Control-Allow-Origin"], "http://127.0.0.1:5173");
  assert.equal(corsHeadersForOrigin("https://unapproved.example", "https://cabconnect.example")["Access-Control-Allow-Origin"], undefined);
  assert.equal(isAllowedOrigin("https://unapproved.example", "https://cabconnect.example"), false);
});
