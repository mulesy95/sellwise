import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to SellWise
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: 15 May 2026</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. About these terms</h2>
            <p>
              These Terms of Service govern your use of SellWise (the "Service"), operated by SellWise
              ("we", "us", "our"). By creating an account or using the Service, you agree to these terms.
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. The Service</h2>
            <p>
              SellWise is an AI-powered tool that helps online sellers generate optimised titles, tags,
              descriptions, and keywords for marketplace listings on platforms including Etsy, Amazon,
              Shopify, and eBay. Content is generated using large language models and is provided as a
              starting point — you are responsible for reviewing and editing any AI-generated content
              before using it.
            </p>
            <p>
              We do not guarantee that AI-generated content will improve your search rankings, sales, or
              listing performance. Results vary depending on your product, platform, and many other
              factors outside our control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. Accounts</h2>
            <p>
              You must provide accurate information when creating an account. You are responsible for
              keeping your login credentials secure and for all activity that occurs under your account.
              Notify us immediately at{" "}
              <a href="mailto:support@sellwise.au" className="text-primary hover:underline">
                support@sellwise.au
              </a>{" "}
              if you suspect unauthorised access.
            </p>
            <p>
              You must be at least 18 years old to create an account. One account per person — creating
              multiple accounts to circumvent usage limits is not permitted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Subscriptions and billing</h2>
            <p>
              Paid plans are billed monthly or annually via Stripe. Prices are in USD. Your subscription
              renews automatically at the end of each billing period unless cancelled.
            </p>
            <p>
              You may cancel at any time from your account settings. Cancellation takes effect at the end
              of your current billing period — you retain access until then. We do not offer refunds for
              partial periods, except where required by applicable law.
            </p>
            <p>
              Free trial periods (where offered) automatically convert to a paid plan at the end of the
              trial unless cancelled beforehand. No charge is made during the trial period.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Third-party platform integrations</h2>
            <p>
              Where you connect a third-party account (such as Etsy or Shopify), you authorise SellWise
              to access and, where applicable, update your listing data on your behalf. We only access
              the data necessary to provide the features you use. You may disconnect any integration at
              any time from your account settings.
            </p>
            <p>
              Your use of connected platforms is also subject to those platforms' own terms of service.
              We are not responsible for any actions taken by third-party platforms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Use the Service to generate spam, misleading, or deceptive content</li>
              <li>Attempt to reverse-engineer, scrape, or overload our systems</li>
              <li>Resell or sublicense access to the Service without our written consent</li>
              <li>Use the Service in any way that violates applicable laws or regulations</li>
              <li>Share your account credentials with others</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Intellectual property</h2>
            <p>
              You retain ownership of any content you input into the Service. You own the AI-generated
              output produced for you, subject to any restrictions imposed by the underlying AI provider
              (Anthropic).
            </p>
            <p>
              The SellWise platform, brand, and underlying software remain our property. Nothing in these
              terms transfers any ownership of our intellectual property to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, SellWise is not liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the Service, including
              loss of profits, revenue, data, or business opportunities.
            </p>
            <p>
              Our total liability to you for any claim arising out of or relating to these terms or the
              Service is limited to the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. Changes to the Service and terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of material changes by email
              or via the Service. Continued use after the effective date of changes constitutes acceptance.
            </p>
            <p>
              We may modify, suspend, or discontinue any part of the Service at any time. We will give
              reasonable notice where possible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">10. Governing law</h2>
            <p>
              These terms are governed by the laws of Victoria, Australia. Any disputes will be subject
              to the exclusive jurisdiction of the courts of Victoria.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">11. Contact</h2>
            <p>
              Questions about these terms?{" "}
              <a href="mailto:support@sellwise.au" className="text-primary hover:underline">
                support@sellwise.au
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 flex gap-4 border-t border-border pt-8 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/" className="hover:text-foreground">Home</Link>
        </div>
      </div>
    </div>
  );
}
