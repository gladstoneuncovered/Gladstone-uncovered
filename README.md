# Gladstone Uncovered

Marketing site for Gladstone Uncovered — creative media, aerial imagery and industrial services across Gladstone and Central Queensland.

## Pages

- `index.html` — homepage
- `services.html` — six core services
- `pricing.html` — enquiry-led pricing overview
- `about.html` — about and principles
- `bookings.html` — availability (Cal.com embed)

## Preview

```bash
cd ~/Projects/gladstone-uncovered
ruby -run -e httpd . -p 8080
```

Visit `http://localhost:8080/bookings.html`.

## Instant quote (Real Estate Photography)

Specialist aerial photography uses an instant quote builder:

1. Open **Services** → **Get instant quote**, or `quote.html?service=real-estate`
2. Choose location, property type, and add-ons
3. **Book now** opens Stripe Checkout (details + payment)

Base package is **$299 AUD** (edit in `js/quote-data.js`).

### Stripe setup

1. Create a [Stripe](https://dashboard.stripe.com) account and copy the **Secret key**
2. In Supabase → Edge Functions → Secrets, set:
   - `STRIPE_SECRET_KEY`
   - `SITE_URL` (your live site origin)
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` if not already set
3. Deploy: `supabase functions deploy create-checkout`

Until Stripe is connected, Book now falls back to emailing `admin@gladstoneuncovered.com`.

## Bookings (Cal.com)


Availability and Google Calendar sync are handled by **Cal.com** — no custom backend.

1. Sign up at [cal.com](https://cal.com)
2. Connect Dylan’s and Haydn’s Google Calendars (Settings → Calendars)
3. Create an event type (e.g. Discovery / Shoot)
4. Put the link slug in `js/config.js`:

```js
window.GLADSTONE_CONFIG = {
  calLink: "your-username/your-event", // from cal.com/your-username/your-event
  calLayout: "month_view",
};
```

5. Refresh the Availability page — the calendar embeds inline.

Cal.com blocks times that are busy on connected Google Calendars, and writes new bookings back as events.

## Deploy (Vercel Drop)

Drag the `deploy-temp/` folder onto [vercel.com/new](https://vercel.com/new) after refreshing it from the project root.
