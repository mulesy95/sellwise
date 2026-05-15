import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to SellWise
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: 15 May 2026</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Overview</h2>
            <p>
              SellWise ("we", "us", "our") is committed to protecting your personal information. This
              policy explains what data we collect, how we use it, and your rights in relation to it.
              We comply with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles.
            </p>
            <p>
              For questions or requests, contact us at{" "}
              <a href="mailto:support@sellwise.au" className="text-primary hover:underline">
                support@sellwise.au
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Information we collect</h2>

            <h3 className="text-sm font-semibold text-foreground/90">Account information</h3>
            <p>
              When you create an account: your email address, name, and password (stored as a secure hash).
              If you sign up via Google OAuth, we receive your name and email from Google.
            </p>

            <h3 className="text-sm font-semibold text-foreground/90">Usage data</h3>
            <p>
              We track how many optimisations, keyword searches, competitor analyses, and audits you run
              each month. This is used to enforce plan limits and display your usage in the dashboard.
            </p>

            <h3 className="text-sm font-semibold text-foreground/90">Content you provide</h3>
            <p>
              Product titles, descriptions, and other listing details you enter to generate optimised
              content. This data is sent to the AI provider (Anthropic) to generate results and may be
              stored in your optimisation history.
            </p>

            <h3 className="text-sm font-semibold text-foreground/90">Shop integration data</h3>
            <p>
              If you connect an Etsy or Shopify store, we store OAuth access tokens and basic shop
              information (shop name, URL, shop ID) to enable listing access. We do not store full
              product catalogues — listing data is fetched on demand and not persisted.
            </p>

            <h3 className="text-sm font-semibold text-foreground/90">Payment information</h3>
            <p>
              Payments are processed by Stripe. We do not store card numbers or payment details. We
              receive a Stripe customer ID, subscription status, and plan information.
            </p>

            <h3 className="text-sm font-semibold text-foreground/90">Technical data</h3>
            <p>
              Standard server logs including IP addresses, browser type, and pages accessed. We use
              PostHog for product analytics — this may include page views, feature usage, and session
              data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. How we use your information</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>To provide and operate the Service</li>
              <li>To enforce usage limits and manage your subscription</li>
              <li>To send transactional emails (account confirmation, billing receipts, trial reminders)</li>
              <li>To improve the Service using aggregated, anonymised usage data</li>
              <li>To respond to support requests</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p>
              We do not sell your personal information. We do not use your listing content to train AI
              models.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Third-party services</h2>
            <p>We use the following third-party services to operate SellWise:</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2 text-left font-medium text-foreground">Service</th>
                    <th className="px-4 py-2 text-left font-medium text-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    ["Supabase", "Database and authentication"],
                    ["Stripe", "Payment processing and subscriptions"],
                    ["Anthropic (Claude)", "AI content generation"],
                    ["Resend", "Transactional email delivery"],
                    ["PostHog", "Product analytics"],
                    ["Vercel", "Hosting and infrastructure"],
                    ["Etsy API", "Shop integration (if connected)"],
                    ["Shopify API", "Shop integration (if connected)"],
                  ].map(([service, purpose]) => (
                    <tr key={service}>
                      <td className="px-4 py-2 font-medium text-foreground/80">{service}</td>
                      <td className="px-4 py-2 text-muted-foreground">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Each of these services has its own privacy policy. We choose providers that meet reasonable
              data protection standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Data storage and security</h2>
            <p>
              Your data is stored in Supabase (hosted on AWS ap-south-1, Mumbai). We use encryption in
              transit (HTTPS/TLS) and at rest. Access tokens for third-party integrations are stored
              encrypted.
            </p>
            <p>
              No security system is foolproof. In the event of a data breach that is likely to result in
              serious harm, we will notify affected users and the relevant authorities as required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Data retention</h2>
            <p>
              We retain your account data for as long as your account is active. Usage counters are reset
              monthly. Optimisation history is retained until you delete it or close your account.
            </p>
            <p>
              When you close your account, we delete your personal data within 30 days, except where
              retention is required by law (e.g. billing records).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Cookies</h2>
            <p>
              We use strictly necessary cookies for authentication (session management). We do not use
              advertising cookies. PostHog analytics may set a cookie to identify returning sessions —
              this is anonymised and does not identify you personally.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. Your rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Disconnect any third-party integration at any time</li>
              <li>Opt out of non-essential communications</li>
            </ul>
            <p>
              To exercise any of these rights, email{" "}
              <a href="mailto:support@sellwise.au" className="text-primary hover:underline">
                support@sellwise.au
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of material changes by
              email or via the Service. The "last updated" date at the top of this page reflects the
              most recent revision.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">10. Contact</h2>
            <p>
              For any privacy-related questions or requests:{" "}
              <a href="mailto:support@sellwise.au" className="text-primary hover:underline">
                support@sellwise.au
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 flex gap-4 border-t border-border pt-8 text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/" className="hover:text-foreground">Home</Link>
        </div>
      </div>
    </div>
  );
}
