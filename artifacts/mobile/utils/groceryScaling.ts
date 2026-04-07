/**
 * Parse a quantity string into a number.
 * Handles: "2", "1.5", "1/2", "1/4", "3-4" (takes first number).
 */
function parseQuantity(s: string): number | null {
  const trimmed = s.trim();

  // Handle fractions: "1/2", "3/4"
  const fracMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    return parseInt(fracMatch[1], 10) / parseInt(fracMatch[2], 10);
  }

  // Handle mixed fractions: "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1], 10) + parseInt(mixedMatch[2], 10) / parseInt(mixedMatch[3], 10);
  }

  // Handle ranges: "3-4" → take first number
  const rangeMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*-\s*\d/);
  if (rangeMatch) {
    return parseFloat(rangeMatch[1]);
  }

  // Handle plain numbers: "2", "1.5", "500"
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

/**
 * Parse an amount string into quantity and the rest.
 * "500g" → { quantity: 500, rest: "g" }
 * "2 cups, sifted" → { quantity: 2, rest: " cups, sifted" }
 * "1/2 tsp" → { quantity: 0.5, rest: " tsp" }
 * "to taste" → null
 */
function parseAmount(amount: string): { quantity: number; rest: string } | null {
  // Match leading number (possibly fraction or decimal) and the rest
  const match = amount.match(/^([\d\s/.]+(?:-\d+(?:\.\d+)?)?)\s*(.*)/);
  if (!match) return null;

  const quantity = parseQuantity(match[1]);
  if (quantity === null) return null;

  return { quantity, rest: match[2] };
}

/**
 * Format a number nicely: remove trailing .0, round to 1 decimal.
 */
function formatQuantity(n: number): string {
  if (n === 0) return '0';
  const rounded = Math.round(n * 10) / 10;
  if (rounded === Math.floor(rounded)) return String(Math.floor(rounded));
  return rounded.toFixed(1);
}

/**
 * Scale an ingredient amount string by a serving ratio.
 *
 * @param originalAmount  e.g. "500g", "2 cups, sifted", "1/2 tsp", "to taste"
 * @param baseServings    The recipe's original serving count
 * @param targetServings  The user's desired serving count
 * @returns Scaled amount string, or original if not parseable
 */
export function computeScaledAmount(
  originalAmount: string,
  baseServings: number,
  targetServings: number
): string {
  if (baseServings === targetServings || baseServings <= 0) return originalAmount;

  const parsed = parseAmount(originalAmount);
  if (!parsed) return originalAmount;

  const ratio = targetServings / baseServings;
  const scaled = parsed.quantity * ratio;

  return `${formatQuantity(scaled)}${parsed.rest ? (parsed.rest.startsWith(' ') ? '' : '') + parsed.rest : ''}`;
}
