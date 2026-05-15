# SellWise — Tech Stack & Admin URLs

Quick reference for where to manage each part of the infrastructure.

---

## Domain & DNS
| Service | URL | What to do here |
|---------|-----|-----------------|
| VentraIP | https://ventraip.com.au | Domain registrar for sellwise.au — manage DNS records, renewals |

**DNS setup:** Point `sellwise.au` and `www.sellwise.au` to Vercel via CNAME or A records from the Vercel dashboard.

---

## Hosting & Deployment
| Service | URL | What to do here |
|---------|-----|-----------------|
| Vercel | https://vercel.com/dashboard | Deployments, env vars, domains, logs, preview URLs |
| GitHub | https://github.com/mulesy95/sellwise | Source code, branches, PRs |

---

## Database & Auth
| Service | URL | What to do here |
|---------|-----|-----------------|
| Supabase | https://supabase.com/dashboard/project/iqexhnxtseffacaymvho | Tables, RLS, auth settings, SQL editor, logs |

---

## Payments
| Service | URL | What to do here |
|---------|-----|-----------------|
| Stripe (sandbox) | https://dashboard.stripe.com/test | Test mode — products, prices, webhooks, customers |
| Stripe (live) | https://dashboard.stripe.com | Production — same, flip to live mode before launch |

Webhook endpoint: `https://sellwise.au/api/stripe/webhook`

---

## AI
| Service | URL | What to do here |
|---------|-----|-----------------|
| Anthropic Console | https://console.anthropic.com | API keys, usage, billing |

---

## Email
| Service | URL | What to do here |
|---------|-----|-----------------|
| Resend | https://resend.com/dashboard | Email logs, API keys, domain verification |

---

## Analytics
| Service | URL | What to do here |
|---------|-----|-----------------|
| PostHog | https://app.posthog.com | Product analytics, feature flags, funnels |

---

## Platform Integrations
| Service | URL | What to do here |
|---------|-----|-----------------|
| Etsy Developer Portal | https://www.etsy.com/developers/your-apps | App settings, OAuth redirect URIs, API keys |
| Shopify Partners | https://partners.shopify.com | App management, test store, credentials |

---

## Env Vars — where each key comes from

| Variable | Source |
|----------|--------|
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys |
| `STRIPE_STARTER_PRICE_ID` | Stripe → Products |
| `STRIPE_GROWTH_PRICE_ID` | Stripe → Products |
| `STRIPE_STUDIO_PRICE_ID` | Stripe → Products |
| `RESEND_API_KEY` | Resend → API Keys |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog → Project Settings |
| `ETSY_CLIENT_ID` | Etsy Developer Portal → Your App → Keystring |
| `SHOPIFY_CLIENT_ID` | Shopify Partners → App → Client ID |
| `SHOPIFY_CLIENT_SECRET` | Shopify Partners → App → Client Secret |
| `NEXT_PUBLIC_APP_URL` | Set manually — `https://sellwise.au` in prod |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
