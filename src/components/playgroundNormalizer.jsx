/**
 * Normalizes a raw playground name input.
 * Strips Hebrew prepositions and common location words.
 */
export function normalizePlaygroundName(raw) {
  if (!raw) return "";

  let name = raw.trim();

  // Remove leading prepositions and common words (order matters - longer first)
  const prefixes = ["בגינה", "בגן", "לגינה", "לגן", "גינה", "גן", "ב", "ל"];
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length).trim();
      break;
    }
  }

  return name.trim();
}

/**
 * Simple string similarity score (0-1) using character bigrams.
 */
function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);
  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/**
 * Finds or creates a canonical Playground record for the group.
 * Returns the canonical name to use.
 * base44Entities = base44.entities (passed in to avoid circular imports)
 */
export async function resolvePlaygroundName(rawText, groupId, base44Entities) {
  const cleaned = normalizePlaygroundName(rawText);
  if (!cleaned) return rawText;

  const existing = await base44Entities.Playground.filter({ group_id: groupId });

  // Exact match (case-insensitive)
  const exact = existing.find(
    (p) => p.canonical_name.toLowerCase() === cleaned.toLowerCase()
  );
  if (exact) return exact.canonical_name;

  // High similarity match (≥ 0.8)
  const similar = existing.find(
    (p) => similarity(p.canonical_name.toLowerCase(), cleaned.toLowerCase()) >= 0.8
  );
  if (similar) return similar.canonical_name;

  // No match — create new playground record
  await base44Entities.Playground.create({
    group_id: groupId,
    canonical_name: cleaned,
    raw_text: rawText,
  });

  return cleaned;
}