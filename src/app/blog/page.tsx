import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "./posts";

export const metadata: Metadata = {
  title: "Marketplace SEO Blog — SellWise",
  description:
    "Practical guides on writing listings that rank on Shopify, eBay, Amazon, and Etsy. Platform-specific rules, tested tactics, and real examples.",
  openGraph: {
    title: "Marketplace SEO Blog — SellWise",
    description:
      "Practical guides on writing listings that rank on Shopify, eBay, Amazon, and Etsy.",
    url: "/blog",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "SellWise Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace SEO Blog — SellWise",
    description:
      "Practical guides on writing listings that rank on Shopify, eBay, Amazon, and Etsy.",
    images: ["/api/og"],
  },
};

export default function BlogIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
        Marketplace SEO
      </h1>
      <p className="text-lg text-muted-foreground mb-12">
        Platform-specific guides for sellers who want their listings to rank.
      </p>

      <div className="divide-y divide-border/50">
        {posts.map((post) => (
          <article key={post.slug} className="py-8 group">
            <Link href={`/blog/${post.slug}`} className="block">
              <div className="flex items-center gap-2 mb-2">
                {post.platform && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {post.platform}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(post.date).toLocaleDateString("en-AU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{post.readTime} min read</span>
              </div>
              <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                {post.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">{post.description}</p>
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
