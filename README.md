# Dewday static website and Worker

A Cloudflare Pages/Workers application featuring a responsive landing page and a secure contact form backed by a Worker.

## Features

- Responsive static website with accessible navigation and forms
- Cloudflare Assets integration for the frontend
- Worker endpoint at `/api/contact` for validated form submissions
- Server-side email delivery through an environment-configured API
- Health check endpoint at `/health`
- Automated tests for the contact Worker

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. Replace the values in `.dev.vars` with your real email provider settings.

4. Start the Cloudflare Worker locally:

   ```bash
   npm run dev
   ```

5. Open the local URL printed by Wrangler.

## Cloudflare deployment

1. Create a Cloudflare Worker from this repository.
2. Configure the following secrets in Cloudflare Workers:

   - `EMAIL_API_URL`
   - `EMAIL_API_TOKEN`

3. Deploy with:

   ```bash
   npm run deploy
   ```

The `EMAIL_API_URL` must point to an email provider endpoint that accepts an authenticated request. The API token remains server-side and is never exposed to the browser.

## Contact endpoint

Send a JSON request to `/api/contact`:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "message": "Hello from the Dewday website."
}
```

The Worker rejects missing, malformed, or oversized fields and returns JSON errors for invalid submissions.

## Scripts

- `npm test` — run the Worker tests
- `npm run dev` — start Wrangler locally
- `npm run build` — create a Cloudflare deployment dry run
- `npm run deploy` — deploy the Worker and static assets
