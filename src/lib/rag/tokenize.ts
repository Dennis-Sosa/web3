function normalizeFullWidth(s: string) {
  return s.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

function isAllDigits(s: string) {
  return /^[0-9]+$/.test(s);
}

const CJK_RUN_RE =
  /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+$/u;

export function cjkNgramTokenize(input: string): string[] {
  const s = normalizeFullWidth(input).toLowerCase();
  const tokens: string[] = [];

  // CJK runs are turned into bi/tri-grams; latin/digit runs are kept as-is.
  // This is a practical compromise that works well with BM25-style ranking.
  const re =
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+|0x[a-f0-9]+|[a-z0-9]+(?:[._:/-][a-z0-9]+)*/giu;

  for (const m of s.matchAll(re)) {
    const raw = m[0] ?? "";
    if (!raw) continue;

    if (CJK_RUN_RE.test(raw)) {
      const run = raw;
      const len = run.length;

      if (len <= 6) tokens.push(run);
      if (len >= 2) {
        for (let i = 0; i <= len - 2; i++) tokens.push(run.slice(i, i + 2));
      }
      if (len >= 3) {
        for (let i = 0; i <= len - 3; i++) tokens.push(run.slice(i, i + 3));
      }
      continue;
    }

    // ascii / hex / mixed
    const tok = raw.toLowerCase();
    if (tok.length <= 1) continue;
    if (isAllDigits(tok)) continue;

    tokens.push(tok);

    // Add sub-tokens split by common separators to improve recall.
    const parts = tok.split(/[._:/-]+/g).filter(Boolean);
    for (const p of parts) {
      if (p.length <= 1) continue;
      if (isAllDigits(p)) continue;
      tokens.push(p);
    }
  }

  return tokens;
}

