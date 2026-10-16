/** Normalisation des tags : minuscule, sans accents, kebab-case. */
export function normalizeTag(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeTags(raw: string[] | string | undefined | null): string[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.split(/[|;,]/);
  const out = new Set<string>();
  for (const t of list) {
    const n = normalizeTag(String(t));
    if (n) out.add(n);
  }
  return [...out];
}

export function numAttr(attrs: Record<string, unknown>, key: string): number | undefined {
  const v = attrs?.[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}
