/**
 * Case-insensitive set intersection, de-duplicated, preserving `a`'s casing
 * and order. Used for recommendation scoring: "React" on one profile and
 * "react" on another should still count as a shared skill.
 */
export function intersectCaseInsensitive(a: string[], b: string[]): string[] {
  const bSet = new Set(b.map((item) => item.trim().toLowerCase()));
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of a) {
    const key = item.trim().toLowerCase();
    if (bSet.has(key) && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * Generates a handful of common casing variants of a search term (as typed,
 * lowercase, UPPERCASE, Capitalized) for use with Prisma's `hasSome` filter
 * on array columns.
 *
 * This is a deliberate, documented trade-off: Postgres array columns don't
 * support case-insensitive *substring* matching on individual elements
 * through Prisma's query API without raw SQL (e.g. `unnest(skills) ILIKE
 * '%term%'`). Trying a few exact-match casing variants covers the common
 * case ("React" vs "react") cheaply and safely. If true substring search
 * across array elements is needed later, the clean upgrade path is a
 * `$queryRaw` using `unnest()` + `ILIKE`, or a Postgres trigram/full-text
 * index — deliberately not done here to keep this phase's queries simple
 * and fully within Prisma's typed query API.
 */
export function buildCaseVariants(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  const upper = trimmed.toUpperCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);

  return Array.from(new Set([trimmed, lower, upper, capitalized]));
}
