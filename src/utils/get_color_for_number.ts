export type Range = {
  start: number;
  color: string;
};

export function getColorForNumber(
  value: number,
  ranges: Range[],
): string | undefined {
  // Sort the ranges by their start value to ensure they are in order
  const sortedRanges = ranges.sort((a, b) => a.start - b.start);

  // Find the range that contains the value
  for (let i = 0; i < sortedRanges.length; i++) {
    const currentRange = sortedRanges[i];
    const nextRange = sortedRanges[i + 1];

    if (
      (value >= currentRange.start && !nextRange) || // Case for the last range
      (value >= currentRange.start && value < nextRange.start)
    ) {
      return currentRange.color;
    }
  }

  return undefined;
}
