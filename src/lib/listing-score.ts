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

export interface ScoreDeduction {
  label: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  deductions: ScoreDeduction[];
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

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "its", "this", "that", "are",
  "be", "as", "was", "has", "have", "had", "not", "no", "so", "if",
  "your", "our", "my", "their", "you", "we", "i",
]);

function bannedWordDeductions(listing: ScoredListing): ScoreDeduction[] {
  const text = allOutputText(listing).toLowerCase();
  const found: string[] = [];
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word.replace(/-/g, "\\-")}\\b`, "i");
    if (re.test(text)) found.push(word);
  }
  if (found.length === 0) return [];
  const points = Math.min(found.length * 8, 24);
  const wordList = found.map((w) => `"${w}"`).join(", ");
  return [{ label: `Banned word${found.length > 1 ? "s" : ""} used: ${wordList}`, points }];
}

function keywordCoverageDeduction(listing: ScoredListing, userKeywords: string): ScoreDeduction[] {
  const terms = userKeywords
    .split(/[,\n]+/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  if (terms.length === 0) return [];
  const text = allOutputText(listing).toLowerCase();
  const missing = terms.filter((t) => !text.includes(t));
  if (missing.length === 0) return [];
  const missingRatio = missing.length / terms.length;
  let points = 0;
  if (missingRatio <= 0.25) points = 5;
  else if (missingRatio <= 0.5) points = 10;
  else if (missingRatio <= 0.75) points = 15;
  else points = 20;
  const missingList = missing.map((m) => `"${m}"`).join(", ");
  return [{ label: `${missing.length} of ${terms.length} keyword${terms.length > 1 ? "s" : ""} not found in output: ${missingList}`, points }];
}

function etsyTagUniquenessDeduction(tags: string[]): ScoreDeduction[] {
  if (tags.length === 0) return [];
  const wordCount: Record<string, number> = {};
  for (const tag of tags) {
    const words = tag.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    for (const word of words) {
      wordCount[word] = (wordCount[word] ?? 0) + 1;
    }
  }
  const repeated = Object.entries(wordCount)
    .filter(([, c]) => c > 1)
    .map(([w]) => w);
  if (repeated.length === 0) return [];
  const points = Math.min(repeated.length * 5, 15);
  return [{ label: `${repeated.length} word${repeated.length > 1 ? "s" : ""} repeated across tags: ${repeated.map((w) => `"${w}"`).join(", ")}`, points }];
}

function titleDescriptionOverlapDeduction(title: string, description: string): ScoreDeduction[] {
  if (!title || !description) return [];
  const titleWords = title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  if (titleWords.length === 0) return [];
  const descWords = new Set(description.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, "")).filter((w) => w.length > 3));
  const overlap = titleWords.filter((w) => descWords.has(w)).length;
  if (overlap / titleWords.length <= 0.6) return [];
  return [{ label: "Title words reused heavily in description — reduces SEO keyword diversity", points: 10 }];
}

export function scoreWithBreakdown(listing: ScoredListing, ctx?: ScoreContext): ScoreResult {
  let s = 0;
  const deductions: ScoreDeduction[] = [];

  function applyDeductions(deds: ScoreDeduction[]) {
    for (const d of deds) {
      s -= d.points;
      deductions.push(d);
    }
  }

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
      applyDeductions(etsyTagUniquenessDeduction(tags));
      applyDeductions(titleDescriptionOverlapDeduction(title, desc));
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
      applyDeductions(titleDescriptionOverlapDeduction(listing.title ?? "", listing.description ?? ""));
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
      applyDeductions(titleDescriptionOverlapDeduction(listing.metaTitle ?? "", listing.description ?? ""));
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
      applyDeductions(titleDescriptionOverlapDeduction(listing.title ?? "", listing.description ?? ""));
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
      applyDeductions(titleDescriptionOverlapDeduction(listing.seoTitle ?? "", listing.description ?? ""));
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
      return { score: 0, deductions: [] };
  }

  applyDeductions(bannedWordDeductions(listing));
  if (ctx?.userKeywords) {
    applyDeductions(keywordCoverageDeduction(listing, ctx.userKeywords));
  }

  return { score: Math.max(0, Math.min(100, s)), deductions };
}

export function scoreOptimisedListing(listing: ScoredListing, ctx?: ScoreContext): number {
  return scoreWithBreakdown(listing, ctx).score;
}
