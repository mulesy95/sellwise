const SCORE_COLOR = (s: number) =>
  s >= 70 ? "#34d399" : s >= 40 ? "#fbbf24" : "#f87171";

const SCORE_GLOW = (s: number) =>
  s >= 70 ? "#34d39920" : s >= 40 ? "#fbbf2420" : "#f8717120";

function buildCaption(score: number, platform: string, before: number | null): string {
  if (before !== null && before > 0 && score > before) {
    return `Just improved my ${platform} listing from ${before} → ${score}/100 with SellWise 🎯 sellwise.au`;
  }
  return `My ${platform} listing just scored ${score}/100 with SellWise 🎯 sellwise.au`;
}

async function generateScoreCard(
  score: number,
  platform: string,
  before: number | null
): Promise<File | null> {
  try {
    const SIZE = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const color = SCORE_COLOR(score);
    const glow = SCORE_GLOW(score);

    // Background
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Radial glow
    const grad = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, 420);
    grad.addColorStop(0, glow);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // "SellWise" branding — top left
    ctx.font = "700 52px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#f2f2f2";
    ctx.fillText("Sell", 64, 96);
    const sellWidth = ctx.measureText("Sell").width;
    ctx.fillStyle = "#f0873b";
    ctx.fillText("Wise", 64 + sellWidth, 96);

    // Platform chip — top right
    const chipLabel = `${platform} listing`;
    ctx.font = "500 30px system-ui, -apple-system, sans-serif";
    const chipWidth = ctx.measureText(chipLabel).width + 44;
    const chipX = SIZE - 64 - chipWidth;
    ctx.fillStyle = "#1e1e1e";
    ctx.strokeStyle = "#2c2c2c";
    ctx.lineWidth = 1;
    roundRect(ctx, chipX, 52, chipWidth, 54, 27);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#a0a0a0";
    ctx.fillText(chipLabel, chipX + 22, 88);

    if (before !== null && before > 0) {
      // Before → After layout
      const beforeColor = SCORE_COLOR(before);
      const delta = score - before;

      // Before score
      ctx.font = "800 176px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = beforeColor;
      ctx.textAlign = "center";
      ctx.fillText(String(before), SIZE / 2 - 200, SIZE / 2 + 60);

      // Arrow
      ctx.font = "300 80px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#333";
      ctx.fillText("→", SIZE / 2, SIZE / 2 + 60);

      // After score
      ctx.font = "800 176px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(String(score), SIZE / 2 + 200, SIZE / 2 + 60);

      // Delta pill
      const deltaText = `${delta >= 0 ? "+" : ""}${delta} points`;
      ctx.font = "700 38px system-ui, -apple-system, sans-serif";
      const deltaWidth = ctx.measureText(deltaText).width + 56;
      ctx.fillStyle = delta >= 0 ? "#052e1640" : "#2e051640";
      ctx.strokeStyle = delta >= 0 ? "#34d39940" : "#f8717140";
      ctx.lineWidth = 1.5;
      roundRect(ctx, SIZE / 2 - deltaWidth / 2, SIZE / 2 + 100, deltaWidth, 62, 31);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(deltaText, SIZE / 2, SIZE / 2 + 141);

      // "before / after" labels
      ctx.font = "500 28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#484848";
      ctx.fillText("before", SIZE / 2 - 200, SIZE / 2 + 110);
      ctx.fillText("after", SIZE / 2 + 200, SIZE / 2 + 110);
    } else {
      // Single score layout
      ctx.font = "800 240px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(String(score), SIZE / 2, SIZE / 2 + 80);

      ctx.font = "500 36px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#404040";
      ctx.fillText("out of 100", SIZE / 2, SIZE / 2 + 140);
    }

    // Bottom CTA
    ctx.font = "500 26px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#383838";
    ctx.textAlign = "center";
    ctx.fillText("Score your listing free at sellwise.au", SIZE / 2, SIZE - 52);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(null); return; }
          resolve(new File([blob], "sellwise-score.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92
      );
    });
  } catch {
    return null;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export interface ShareScoreOptions {
  score: number;
  platform: string;
  before?: number | null;
  shareUrl: string;
}

/**
 * Returns true if the native share sheet was triggered.
 * Returns false when navigator.share is unavailable (caller should show desktop fallback).
 */
export async function shareScore({
  score,
  platform,
  before = null,
  shareUrl,
}: ShareScoreOptions): Promise<boolean> {
  if (!navigator.share) return false;

  const caption = buildCaption(score, platform, before);

  // Try image share first (works on iOS Safari, Android Chrome)
  const imageFile = await generateScoreCard(score, platform, before);
  if (imageFile && navigator.canShare?.({ files: [imageFile] })) {
    try {
      await navigator.share({ files: [imageFile], text: caption, url: shareUrl });
      return true;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return true; // user dismissed
      // Fall through to text-only
    }
  }

  // Text + URL share (works everywhere navigator.share exists)
  try {
    await navigator.share({ text: caption, url: shareUrl });
    return true;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return true;
    return false;
  }
}

export function buildShareLinks(
  score: number,
  platform: string,
  before: number | null,
  shareUrl: string
) {
  const caption = buildCaption(score, platform, before);
  const encoded = encodeURIComponent(`${caption} ${shareUrl}`);
  return {
    caption,
    twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(caption)}`,
  };
}
