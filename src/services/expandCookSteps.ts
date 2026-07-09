export function expandCookSteps(steps: string[]): string[] {
  const expanded: string[] = [];

  for (const raw of steps) {
    const step = raw.trim();
    if (!step) continue;

    const bySentence = step
      .split(/(?<=[.!?])\s+(?=[A-Za-z"'])/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (bySentence.length > 1) {
      expanded.push(...bySentence);
      continue;
    }

    const byClause = step
      .split(/\s*;\s*|\s+then\s+/i)
      .map((part) => part.trim())
      .filter((part) => part.length > 6);

    if (byClause.length > 1) {
      expanded.push(...byClause);
      continue;
    }

    expanded.push(step);
  }

  return expanded.length > 0 ? expanded : steps;
}
