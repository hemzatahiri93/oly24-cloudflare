# OLY24 — Cloudflare Pages

A mobile-first, multi-page lead-generation website for heating and plumbing service connections.

## Stack
- React 18 + TypeScript + Vite
- Cloudflare Pages static hosting
- Cloudflare Pages Functions for `/api/leads`
- Responsive CSS with Lucide icons

## Routes
- `/` — Home
- `/heating/` — Heating
- `/plumbing/` — Plumbing
- `/frozen-pipes/` — Frozen pipes
- `/water-leaks/` — Water leaks
- `/privacy/` — Privacy policy draft

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Build and test

```bash
npm run build
npm run preview
```

## Cloudflare Pages deployment

1. Push this project to a Git repository.
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository.
4. Set the build command to `npm run build`.
5. Set the build output directory to `dist`.
6. Add the environment variables listed below in Pages project settings.
7. Deploy and test every route and the `/api/leads` endpoint.

Alternatively, use Wrangler:

```bash
npm install
npx wrangler login
npm run cf:deploy
```

### Required production configuration

Set these in Cloudflare Pages project settings:

- `LEAD_WEBHOOK_URL` — HTTPS endpoint that receives validated lead JSON.
- `LEAD_WEBHOOK_TOKEN` — optional bearer token for the receiving endpoint.

Set these build-time variables if applicable:

- `VITE_PHONE_DISPLAY` — human-readable business phone number.
- `VITE_PHONE_E164` — phone number in international format, digits with optional leading `+`.
- `VITE_SITE_URL` — canonical site URL.
- `VITE_GA4_ID`, `VITE_META_PIXEL_ID`, `VITE_TIKTOK_PIXEL_ID` — analytics identifiers, if consent and legal review permit.

The contact phone fields are intentionally blank. The lead form will not claim a request was accepted until a webhook is configured and returns success.

## Lead delivery contract

`POST /api/leads` accepts JSON containing:
`name`, `email`, `zip`, `service`, `details`, `consent`, and attribution fields.

The Pages Function validates the payload and forwards it to `LEAD_WEBHOOK_URL`. It does not persist lead records by itself. Configure and test a secure receiving endpoint before advertising the form.

## Before launch checklist

- Add the real phone number and verify the destination by calling it.
- Configure and test the lead webhook, access controls, retention and notifications.
- Replace the privacy policy draft with a policy reviewed for the actual business and jurisdictions.
- Confirm service-provider relationships, coverage areas, disclosures and advertising claims.
- Add analytics only after configuring the relevant consent and privacy controls.
- Verify all DNS records before connecting `oly24.com`. Preserve existing email MX, SPF, DKIM and DMARC records. Test first on a subdomain such as `preview.oly24.com`.
- Add a real favicon, social share image and final brand assets.
- Run accessibility, performance, mobile and form-delivery tests.

## Business disclosure

The current copy describes OLY24 as a connection platform for independent providers. Do not imply OLY24 itself performs repairs, guarantees availability, employs technicians, or verifies credentials unless those claims are factually true and approved for publication.
