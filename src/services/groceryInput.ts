function normalizeGroceryPhrase(text: string): string {
  return text
    .trim()
    .replace(/^please\s+/i, "")
    .replace(/^(add|get|buy|pick up|i need|we need|put)\s+/i, "")
    .replace(/\s+/g, " ");
}

export function parseGroceryInput(text: string): string[] {
  const cleaned = normalizeGroceryPhrase(text);
  if (!cleaned) return [];

  return cleaned
    .split(/,|;|\band\b|\bplus\b|\balso\b|\n/gi)
    .map((part) => normalizeGroceryPhrase(part))
    .filter((part) => part.length > 0 && part.length < 80);
}
