const RETRYABLE = new Set([429, 503]);

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (!RETRYABLE.has(res.status) || attempt === maxRetries) return res;
    await new Promise<void>((r) =>
      setTimeout(r, delay * (0.75 + Math.random() * 0.5))
    );
    delay = Math.min(delay * 2, 16_000);
  }
  return fetch(url, options);
}
