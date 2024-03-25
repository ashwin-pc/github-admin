export function getUniqueValues<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    // Assumes the array is of strings and undefined values, as per the original function's design
    const filteredArray = array.filter(
      (item) => typeof item === 'string',
    ) as unknown as string[];
    return Array.from(new Set(filteredArray)) as unknown as T[];
  } else {
    const uniqueItemsMap = new Map();
    // Iterate in reverse to keep the last occurrence of each unique value
    for (let i = array.length - 1; i >= 0; i--) {
      const item = array[i];
      const keyValue = item[key];
      if (typeof keyValue === 'string' || typeof keyValue === 'number') {
        // Use keyValue as the Map key to ensure uniqueness
        uniqueItemsMap.set(keyValue, item);
      }
    }
    // Return the array of unique values, reversed again to maintain the original order
    return Array.from(uniqueItemsMap.values()).reverse();
  }
}

export function groupBy<T>(
  items: T[],
  groupByKey: keyof T,
): Record<string, T[]> {
  return items.reduce(
    (result, item) => {
      // Convert the group by key to a string to use as an object key
      const key = String(item[groupByKey]);
      // Initialize the array for this key if it doesn't already exist
      if (!result[key]) {
        result[key] = [];
      }
      // Add the current item to the array for its key
      result[key].push(item);
      return result;
    },
    {} as Record<string, T[]>,
  );
}
