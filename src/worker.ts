export interface Env {
  APP_NAME?: string;
  EMAIL_API_URL?: string;
  EMAIL_API_TOKEN?: string;
  fetch?: typeof fetch;
}

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function badRequest(message: string): Response {
  return jsonResponse({ error: message }, 400);
}

function normalizeInput(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validateContact(body: unknown): ContactPayload | null {
  if (!body || typeof body !== "object") return null;

  const candidate = body as Record<string, unknown>;
  const name = normalizeInput(candidate.name).slice(0, MAX_NAME_LENGTH);
  const email = normalizeInput(candidate.email).slice(0, MAX_EMAIL_LENGTH).toLowerCase();
  const message = normalizeInput(candidate.message).slice(0, MAX_MESSAGE_LENGTH);

  if (!name || !email || !message || !EMAIL_PATTERN.test(email)) {
    return null;
  }

  return { name, email, message };
}

async function sendEmail(payload: ContactPayload, env: Env): Promise<Response> {
  const apiUrl = env.EMAIL_API_URL;
  const token = env.EMAIL_API_TOKEN;

  if (!apiUrl || !token) {
    return jsonResponse({ error: "Email delivery is not configured." }, 503);
  }

  const request = new Request(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    body: JSON.stringify({
      subject: `New contact message from ${payload.name}`,
      to: "hello@dewday.example",
      from: payload.email,
      replyTo: payload.email,
      text: `${payload.message}\n\nFrom: ${payload.name}\nEmail: ${payload.email}`,
    }),
  });

  const fetcher = env.fetch ?? fetch;
  return fetcher(request);
}

export async function handleRequest(request: Request, env: Env = {}): Promise<Response> {
  if (request.method !== "POST" || new URL(request.url).pathname !== "/api/contact") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Please provide a valid JSON request body.");
  }

  const validPayload = validateContact(body);
  if (!validPayload) {
    return badRequest("Please provide a valid name, email, and message.");
  }

  try {
    const emailResponse = await sendEmail(validPayload, env);
    if (!emailResponse.ok) {
      console.error("Email delivery failed", await emailResponse.text());
      return jsonResponse({ error: "The message could not be sent. Please try again later." }, 502);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Contact submission failed", error);
    return jsonResponse({ error: "The message could not be sent. Please try again later." }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleRequest(request, env);
    }

    if (url.pathname === "/health") {
      return jsonResponse({ ok: true, app: env.APP_NAME ?? "Dewday" });
    }

    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) {
      return asset;
    }

    return new Response("Not found", { status: 404 });
  },
};
