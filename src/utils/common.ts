export function getUniqueValues(array: (string | undefined)[]): string[] {
  const removeUndefined = array.filter(
    (item) => item !== undefined,
  ) as string[];
  return Array.from(new Set(removeUndefined));
}
