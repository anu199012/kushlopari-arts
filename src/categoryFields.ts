/** Normalize Firestore category docs (handles keys like "name " with trailing spaces). */

export function normalizeCategoryData(
  id: string,
  raw: Record<string, unknown> | undefined | null
) {
  const data: Record<string, unknown> = { id };
  if (raw) {
    for (const [key, value] of Object.entries(raw)) {
      const cleanKey = key.trim();
      // Prefer already-clean keys; don't overwrite a good `name` with empty "name "
      if (cleanKey in data && cleanKey !== key) continue;
      data[cleanKey] = value;
    }
  }

  const name = pickDisplayName(data, id);
  data.name = name;
  return data;
}

export function pickDisplayName(item: Record<string, unknown>, fallbackId?: string) {
  const candidates = [
    item.name,
    item.title,
    item.categoryName,
    item.label,
    item["name "],
    fallbackId ?? item.id,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "Untitled";
}

export function pickDescription(item: Record<string, unknown>) {
  const candidates = [
    item.description,
    item.details,
    item.caption,
    item.subtitle,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}
