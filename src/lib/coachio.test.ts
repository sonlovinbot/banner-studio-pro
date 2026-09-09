import { afterEach, describe, expect, test } from "bun:test";

import { testApiKey } from "./coachio";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function respondWith(status: number) {
  globalThis.fetch = Object.assign(async () => new Response(null, { status }), {
    preconnect: originalFetch.preconnect,
  });
}

describe("testApiKey", () => {
  test("accepts a valid key when the random task is not found", async () => {
    respondWith(404);
    await expect(testApiKey("key")).resolves.toEqual({
      ok: true,
      message: "API key hợp lệ ✓",
    });
  });

  test.each([401, 403])("rejects an unauthorized key with status %i", async (status) => {
    respondWith(status);
    await expect(testApiKey("key")).resolves.toEqual({
      ok: false,
      message: `API key không hợp lệ (${status})`,
    });
  });

  test.each([400, 402, 429, 500, 503])(
    "does not treat status %i as a valid key",
    async (status) => {
      respondWith(status);
      await expect(testApiKey("key")).resolves.toEqual({
        ok: false,
        message: `Không thể kiểm tra API key (${status})`,
      });
    },
  );
});
