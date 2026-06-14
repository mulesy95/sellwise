import type { Platform } from "@/lib/platforms";
import { BANNED_WORDS } from "@/lib/banned-words";

export interface ScoredListing {
  platform: Platform;
  title?: string;
  tags?: string[];
  bullets?: string[];
  backendKeywords?: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  caption?: string;
  postCopy?: string;
  hashtags?: string[];
}

export interface ScoreContext {
  userKeywords?: string;
}

function wc(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function allOutputText(listing: ScoredListing): string {
  return [
    listing.title,
    listing.description,
    listing.metaTitle,
    listing.metaDescription,
    listing.seoTitle,
    listing.seoDescription,
    listing.caption,
    listing.postCopy,
    ...(listing.tags ?? []),
    ...(listing.bullets ?? []),
    listing.backendKeywords,
  ]
    .filter(Boolean)
    .join(" ");
}

function bannedWordPenalty(listing: ScoredListing): number {
  const text = allOutputText(listing).toLowerCase();
  let hits = 0;
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word.replace("-", "\\-")}\\b`, "i");
    if (re.test(text)) hits++;
  }
  return Math.min(hits * 8, 24); // -8 per hit, max -24
}

function keywordCoveragePenalty(listing: ScoredListing, userKeywords: string): number {
  const terms = userKeywords
    .split(/[,\n]+/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  if (terms.length === 0) return 0;
  const text = allOutputText(listing).toLowerCase();
  const missing = terms.filter((t) => !text.includes(t));
  const missingRatio = missing.length / terms.length;
  if (missingRatio === 0) return 0;
  if (missingRatio <= 0.25) return 5;
  if (missingRatio <= 0.5) return 10;
  if (missingRatio <= 0.75) return 15;
  return 20;
}

export function scoreOptimisedListing(listing: ScoredListing, ctx?: ScoreContext): number {
  let s = 0;

  switch (listing.platform) {
    case "etsy": {
      const title = listing.title ?? "";
      const tags = listing.tags ?? [];
      const desc = listing.description ?? "";
      if (title.length >= 60 && title.length <= 140) s += 40;
      else if (title.length >= 30 && title.length <= 140) s += 25;
      else if (title.length > 0 && title.length <= 140) s += 10;
      if (tags.length === 13) s += 35;
      else if (tags.length >= 10) s += 25;
      else if (tags.length >= 7) s += 15;
      else if (tags.length > 0) s += 8;
      const w = wc(desc);
      if (w >= 150) s += 25;
      else if (w >= 80) s += 15;
      else if (w >= 30) s += 8;
      else if (w > 0) s += 3;
      break;
    }
    case "amazon": {
      const title = listing.title ?? "";
      const bullets = listing.bullets ?? [];
      const backend = listing.backendKeywords ?? "";
      if (title.length >= 100 && title.length <= 200) s += 30;
      else if (title.length >= 50) s += 20;
      else if (title.length > 0) s += 8;
      if (bullets.length === 5) s += 40;
      else if (bullets.length === 4) s += 30;
      else if (bullets.length === 3) s += 20;
      else if (bullets.length > 0) s += 10;
      if (backend.length >= 100) s += 30;
      else if (backend.length > 0) s += 15;
      break;
    }
    case "shopify": {
      const mt = listing.metaTitle ?? "";
      const md = listing.metaDescription ?? "";
      const desc = listing.description ?? "";
      if (mt.length >= 40 && mt.length <= 60) s += 30;
      else if (mt.length >= 20) s += 20;
      else if (mt.length > 0) s += 8;
      if (md.length >= 120 && md.length <= 160) s += 40;
      else if (md.length >= 80) s += 25;
      else if (md.length > 0) s += 10;
      const w = wc(desc);
      if (w >= 150) s += 30;
      else if (w >= 80) s += 20;
      else if (w >= 30) s += 10;
      break;
    }
    case "ebay": {
      const title = listing.title ?? "";
      const desc = listing.description ?? "";
      if (title.length >= 50 && title.length <= 80) s += 50;
      else if (title.length >= 30) s += 35;
      else if (title.length > 0) s += 15;
      const w = wc(desc);
      if (w >= 100) s += 50;
      else if (w >= 50) s += 35;
      else if (w >= 20) s += 20;
      else if (w > 0) s += 10;
      break;
    }
    case "woocommerce":
    case "wix":
    case "squarespace": {
      const st = listing.seoTitle ?? "";
      const sd = listing.seoDescription ?? "";
      const desc = listing.description ?? "";
      if (st.length >= 40 && st.length <= 60) s += 30;
      else if (st.length >= 20) s += 20;
      else if (st.length > 0) s += 8;
      if (sd.length >= 120 && sd.length <= 160) s += 40;
      else if (sd.length >= 80) s += 25;
      else if (sd.length > 0) s += 10;
      const w = wc(desc);
      if (w >= 150) s += 30;
      else if (w >= 80) s += 20;
      else if (w >= 30) s += 10;
      break;
    }
    case "tiktok": {
      const title = listing.title ?? "";
      const desc = listing.description ?? "";
      if (title.length >= 50 && title.length <= 100) s += 50;
      else if (title.length >= 25) s += 35;
      else if (title.length > 0) s += 15;
      const w = wc(desc);
      if (w >= 100) s += 50;
      else if (w >= 50) s += 35;
      else if (w >= 20) s += 20;
      else if (w > 0) s += 10;
      break;
    }
    case "social": {
      const caption = listing.caption ?? "";
      const postCopy = listing.postCopy ?? "";
      const hashtags = listing.hashtags ?? [];
      if (caption.length >= 60 && caption.length <= 125) s += 40;
      else if (caption.length >= 30) s += 25;
      else if (caption.length > 0) s += 10;
      const w = wc(postCopy);
      if (w >= 80) s += 30;
      else if (w >= 40) s += 20;
      else if (w > 0) s += 10;
      if (hashtags.length >= 15 && hashtags.length <= 25) s += 30;
      else if (hashtags.length >= 8) s += 20;
      else if (hashtags.length > 0) s += 10;
      break;
    }
    default:
      return 0;
  }

  // Apply cross-platform deductions
  s -= bannedWordPenalty(listing);
  if (ctx?.userKeywords) s -= keywordCoveragePenalty(listing, ctx.userKeywords);

  return Math.max(0, Math.min(100, s));
}
