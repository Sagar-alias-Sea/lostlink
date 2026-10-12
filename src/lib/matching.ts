export interface ItemForMatching {
  id: string;
  itemName: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
}

export interface MatchResult {
  score: number; // 0 to 100
  factors: {
    categoryMatch: boolean;
    brandMatch: boolean;
    modelMatch: boolean;
    colorMatch: boolean;
    locationMatch: boolean;
    dateProximity: boolean;
  };
  matchedPointsSummary: string[];
}

function normalize(str?: string | null): string {
  return (str || "").toLowerCase().trim();
}

function tokenize(str?: string | null): string[] {
  return normalize(str)
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function calculateMatchScore(
  lost: ItemForMatching,
  found: ItemForMatching
): MatchResult {
  let score = 0;
  const matchedPointsSummary: string[] = [];

  // 1. Category check (Critical factor: 30 pts)
  const categoryMatch =
    normalize(lost.category) === normalize(found.category);
  if (categoryMatch) {
    score += 30;
    matchedPointsSummary.push(`Identical Category: ${lost.category}`);
  }

  // 2. Brand match (20 pts)
  const lostBrand = normalize(lost.brand);
  const foundBrand = normalize(found.brand);
  let brandMatch = false;
  if (lostBrand && foundBrand) {
    if (lostBrand === foundBrand || lostBrand.includes(foundBrand) || foundBrand.includes(lostBrand)) {
      brandMatch = true;
      score += 20;
      matchedPointsSummary.push(`Brand Match: ${lost.brand}`);
    }
  } else if (!lostBrand && !foundBrand) {
    // Neither specified, give neutral small credit if category matches
    if (categoryMatch) score += 5;
  }

  // 3. Model & Item title keyword overlap (20 pts)
  const lostTokens = new Set([
    ...tokenize(lost.itemName),
    ...tokenize(lost.model),
    ...tokenize(lost.description).slice(0, 8),
  ]);
  const foundTokens = new Set([
    ...tokenize(found.itemName),
    ...tokenize(found.model),
    ...tokenize(found.description).slice(0, 8),
  ]);

  let commonTokens = 0;
  foundTokens.forEach((t) => {
    if (lostTokens.has(t)) commonTokens++;
  });

  const modelMatch = commonTokens > 0;
  if (commonTokens >= 2) {
    score += 20;
    matchedPointsSummary.push(`Strong Keyword & Model overlap (${commonTokens} terms)`);
  } else if (commonTokens === 1) {
    score += 10;
    matchedPointsSummary.push("Partial Title/Model keyword match");
  }

  // 4. Color match (15 pts)
  const lostColor = normalize(lost.color);
  const foundColor = normalize(found.color);
  let colorMatch = false;
  if (lostColor && foundColor) {
    if (lostColor === foundColor || lostColor.includes(foundColor) || foundColor.includes(lostColor)) {
      colorMatch = true;
      score += 15;
      matchedPointsSummary.push(`Color Match: ${lost.color}`);
    }
  }

  // 5. Location similarity (10 pts)
  const lostLoc = normalize(lost.location);
  const foundLoc = normalize(found.location);
  let locationMatch = false;
  if (lostLoc && foundLoc) {
    if (lostLoc === foundLoc || lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc)) {
      locationMatch = true;
      score += 10;
      matchedPointsSummary.push(`Location Match: ${lost.location}`);
    }
  }

  // 6. Date proximity (5 pts)
  let dateProximity = false;
  try {
    const lostD = new Date(lost.date).getTime();
    const foundD = new Date(found.date).getTime();
    const diffDays = Math.abs((foundD - lostD) / (1000 * 60 * 60 * 24));
    // Found within 14 days of loss
    if (diffDays <= 14) {
      dateProximity = true;
      score += 5;
      matchedPointsSummary.push(`Date Proximity: within ${Math.round(diffDays)} days`);
    }
  } catch {
    // Ignore date parse failure
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    factors: {
      categoryMatch,
      brandMatch,
      modelMatch,
      colorMatch,
      locationMatch,
      dateProximity,
    },
    matchedPointsSummary,
  };
}
