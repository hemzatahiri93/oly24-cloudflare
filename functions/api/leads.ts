interface Env {
  LEAD_WEBHOOK_URL?: string;
  LEAD_WEBHOOK_TOKEN?: string;
}

interface LeadPayload {
  name?: string;
  email?: string;
  zip?: string;
  service?: string;
  details?: string;
  consent?: boolean;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPage?: string;
  referrer?: string;
}

const allowedServices = new Set([
  "Heating", "Plumbing", "Frozen pipes", "Water leak", "Other home service"
]);

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export const onRequestOptions: PagesFunction = async () => new Response(null, {
  status: 204,
  headers: { "Allow": "POST, OPTIONS" }
});

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return json({ ok: false, message: "Content type must be application/json." }, 415);

  const raw = await request.text();
  if (raw.length > 12000) return json({ ok: false, message: "Request is too large." }, 413);

  let payload: LeadPayload;
  try {
    payload = JSON.parse(raw) as LeadPayload;
  } catch {
    return json({ ok: false, message: "Invalid request body." }, 400);
  }

  const zip = String(payload.zip || "").trim();
  const service = String(payload.service || "").trim();
  const email = String(payload.email || "").trim();
  const name = String(payload.name || "").trim();
  const details = String(payload.details || "").trim();

  if (!/^\d{5}$/.test(zip)) return json({ ok: false, message: "Enter a valid 5-digit ZIP code." }, 400);
  if (!allowedServices.has(service)) return json({ ok: false, message: "Choose a valid service category." }, 400);
  if (payload.consent !== true) return json({ ok: false, message: "Consent is required to submit this request." }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, message: "Enter a valid email address." }, 400);
  if (name.length > 120 || email.length > 254 || details.length > 2000) return json({ ok: false, message: "One or more fields are too long." }, 400);

  if (!env.LEAD_WEBHOOK_URL) {
    return json({ ok: false, message: "Online requests are not enabled yet. Please use the contact option shown on the site." }, 503);
  }

  const lead = {
    receivedAt: new Date().toISOString(),
    name, email, zip, service, details,
    attribution: {
      source: String(payload.source || "").slice(0, 200),
      medium: String(payload.medium || "").slice(0, 200),
      campaign: String(payload.campaign || "").slice(0, 200),
      content: String(payload.content || "").slice(0, 200),
      term: String(payload.term || "").slice(0, 200),
      landingPage: String(payload.landingPage || "").slice(0, 500),
      referrer: String(payload.referrer || "").slice(0, 500)
    }
  };

  try {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (env.LEAD_WEBHOOK_TOKEN) headers.set("Authorization", `Bearer ${env.LEAD_WEBHOOK_TOKEN}`);
    const upstream = await fetch(env.LEAD_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(lead)
    });
    if (!upstream.ok) return json({ ok: false, message: "We could not forward your request right now. Please try again later." }, 502);
    return json({ ok: true });
  } catch {
    return json({ ok: false, message: "We could not submit your request right now. Please try again later." }, 502);
  }
};