const CULINARY_VERBS = [
  'sear', 'dice', 'deglaze', 'blanch', 'fold', 'julienne', 'braise',
  'sauté', 'saute', 'simmer', 'roast', 'grill', 'poach', 'whisk',
  'knead', 'proof', 'marinate', 'reduce', 'caramelize', 'mince',
  'chop', 'slice', 'zest', 'temper', 'emulsify', 'flambé', 'flambe',
  'baste', 'truss', 'score', 'butterfly', 'render', 'bloom', 'toast',
  'char', 'smoke', 'cure', 'ferment', 'steep', 'infuse', 'strain',
  'skim', 'mount', 'season', 'dress', 'toss', 'drizzle', 'garnish',
  'plate', 'rest', 'boil', 'stir', 'fry', 'bake', 'broil', 'steam',
  'brown', 'glaze', 'stuff', 'blend', 'puree', 'mash', 'grate',
  'peel', 'trim', 'pound', 'beat', 'cream', 'cook', 'heat', 'add',
  'pour', 'transfer', 'remove', 'serve', 'sprinkle', 'brush',
];

// Build a regex that matches verb stems (including -ed, -ing, -s, -es)
const verbPattern = CULINARY_VERBS
  .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const VERB_REGEX = new RegExp(
  `\\b((?:${verbPattern})(?:ed|ing|es|s|d)?)\\b`,
  'gi'
);

export interface TextSegment {
  text: string;
  isVerb: boolean;
}

/**
 * Splits an instruction string into segments, marking culinary action verbs.
 * Matches verb stems and common conjugations (-ed, -ing, -s, -es).
 * Case-insensitive matching, preserves original casing.
 */
export function highlightCulinaryVerbs(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  // Reset regex state
  VERB_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = VERB_REGEX.exec(text)) !== null) {
    // Add non-verb text before this match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), isVerb: false });
    }
    // Add the verb
    segments.push({ text: match[0], isVerb: true });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isVerb: false });
  }

  // If no matches, return the whole string as one segment
  if (segments.length === 0) {
    segments.push({ text, isVerb: false });
  }

  return segments;
}
