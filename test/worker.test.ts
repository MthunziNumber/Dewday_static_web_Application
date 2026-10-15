import { describe, expect, it } from "vitest";
import { handleRequest } from "../src/worker";

describe("contact form Worker", () => {
  it("returns 405 for unsupported methods", async () => {
    const response = await handleRequest(new Request("https://example.com/", { method: "GET" }));

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: "Method not allowed" });
  });

  it("rejects an empty contact submission", async () => {
    const response = await handleRequest(
      new Request("https://example.com/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      {
        EMAIL_API_URL: "https://example.com/api/email",
        EMAIL_API_TOKEN: "test-token",
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Please provide a valid name, email, and message." });
  });

  it("sends a valid email and returns success", async () => {
    const calls: unknown[] = [];
    const response = await handleRequest(
      new Request("https://example.com/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Ada Lovelace",
          email: "ada@example.com",
          message: "Hello from the test suite.",
        }),
      }),
      {
        EMAIL_API_URL: "https://example.com/api/email",
        EMAIL_API_TOKEN: "test-token",
        fetch: async (input: string | URL | Request, init?: RequestInit) => {
          calls.push({ input, init });
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        },
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(calls).toHaveLength(1);
  });
});
