# AI Horizon School

`AI Horizon School, Powered by Cloudflare` is a LATAM-first workshop runner for Cloudflare customers and partners.

The first workshop, **AI Horizon Foundations**, guides a 90-minute session from business context through use-case selection, trust boundaries, Cloudflare capability mapping, and a 30-day action plan.

## MVP capabilities

- Customer and Partner audience views
- English, Spanish, and Brazilian Portuguese
- Fourteen lesson pages modeled after a school experience
- Eleven hands-on exercises
- Seven supporting resource pages
- Facilitator mode with delivery notes
- Embedded reference notes inside each page, so the site stays usable without external links
- Browser-local progress per audience
- Responsive experience for facilitator and attendee devices

## Run locally

```sh
npm install
npm run dev
```

## Deploy

The Worker serves the built Vite SPA and is configured for `ai-horizon.cf1demos.com`.

```sh
npm run deploy
```

The custom domain must exist and be available in the configured Cloudflare account before deployment.

## Content model

Workshop content is defined in `src/content.js`. Each module contains localized customer-safe content plus facilitator notes. The UI applies a small audience-specific overlay without exposing internal-only content.
