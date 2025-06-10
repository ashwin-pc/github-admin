import { getUniqueValues, groupBy } from './common';

describe('getUniqueValues', () => {
  // Test scenarios for primitives without key
  describe('primitives without key (only strings are kept)', () => {
    it('should return unique strings from an array of strings with duplicates', () => {
      const arr = ['apple', 'banana', 'orange', 'apple', 'banana'];
      expect(getUniqueValues(arr)).toEqual(['apple', 'banana', 'orange']);
    });

    it('should return an empty array from an array of numbers with duplicates (as numbers are filtered out)', () => {
      const arr = [1, 2, 3, 1, 2];
      expect(getUniqueValues(arr)).toEqual([]);
    });

    it('should return unique strings from an array of mixed strings and numbers (numbers filtered out)', () => {
      const arr = ['apple', 1, 'banana', 2, 'apple', 1];
      expect(getUniqueValues(arr)).toEqual(['apple', 'banana']);
    });

    it('should return the same array if all strings are unique', () => {
      const arr = ['apple', 'banana', 'orange'];
      expect(getUniqueValues(arr)).toEqual(['apple', 'banana', 'orange']);
    });

    it('should return unique values if all strings are duplicates', () => {
      const arr = ['apple', 'apple', 'apple'];
      expect(getUniqueValues(arr)).toEqual(['apple']);
    });

    it('should return an empty array if input is an empty array', () => {
      const arr: string[] = [];
      expect(getUniqueValues(arr)).toEqual([]);
    });

    it('should handle null and undefined values (they are filtered out)', () => {
      const arr = ['apple', null, 'banana', undefined, 'apple', null];
      expect(getUniqueValues(arr)).toEqual(['apple', 'banana']);
    });
  });

  // Test scenarios for objects with key
  describe('objects with key (keeps first occurrence, key must be string/number, order is reverse of last key appearance)', () => {
    it('should return unique objects based on a string key, keeping first occurrences', () => {
      const arr = [
        { id: '1', name: 'apple' }, // First '1'
        { id: '2', name: 'banana' },
        { id: '1', name: 'orange' }, // This '1' is a duplicate
      ];
      // Order is reverse of last unique key appearance: '2' (from index 1) then '1' (from index 2, taking first item for '1')
      expect(getUniqueValues(arr, 'id')).toEqual([
        { id: '2', name: 'banana' },
        { id: '1', name: 'apple' },
      ]);
    });

    it('should return unique objects based on a number key, keeping first occurrences', () => {
      const arr = [
        { id: 1, name: 'apple' }, // First 1
        { id: 2, name: 'banana' },
        { id: 1, name: 'orange' }, // This 1 is a duplicate
      ];
      // Order is reverse of last unique key appearance: 2 (from index 1) then 1 (from index 2, taking first item for 1)
      expect(getUniqueValues(arr, 'id')).toEqual([
        { id: 2, name: 'banana' },
        { id: 1, name: 'apple' },
      ]);
    });

    it('should keep the first occurrence of an object with a duplicate key', () => {
      const arr = [
        { id: '1', value: 'first' }, // This is kept
        { id: '2', value: 'second' },
        { id: '1', value: 'third' }, // This is a duplicate of '1'
      ];
      // Order is reverse of last unique key appearance: '2' (from index 1) then '1' (from index 2, taking first item for '1')
      expect(getUniqueValues(arr, 'id')).toEqual([
        { id: '2', value: 'second' },
        { id: '1', value: 'first' },
      ]);
    });

    it('should return the same array if all key values are unique', () => {
      const arr = [
        { id: '1', name: 'apple' },
        { id: '2', name: 'banana' },
        { id: '3', name: 'orange' },
      ];
      expect(getUniqueValues(arr, 'id')).toEqual(arr);
    });

    it('should return the first object if all key values are the same', () => {
      const arr = [
        { id: '1', name: 'apple' }, // This is kept
        { id: '1', name: 'banana' },
        { id: '1', name: 'orange' },
      ];
      expect(getUniqueValues(arr, 'id')).toEqual([{ id: '1', name: 'apple' }]);
    });

    it('should return an empty array if input is an empty array (objects)', () => {
      const arr: { id: string; name: string }[] = [];
      expect(getUniqueValues(arr, 'id')).toEqual([]);
    });

    it('should skip objects where the specified key is not present (value is undefined)', () => {
      const arr = [
        { id: '1', name: 'apple' },
        { name: 'banana' },
        { id: '1', name: 'orange' },
      ] as any[];
      expect(getUniqueValues(arr, 'id')).toEqual([
        { id: '1', name: 'apple' },
      ]);
    });

    it('should skip objects where the key value is not a string or number (e.g. object)', () => {
      const arrWithObjectKey = [
        { id: { key: '1' }, name: 'apple' },
        { id: { key: '2' }, name: 'banana' },
        { id: { key: '1' }, name: 'orange' },
      ];
      expect(getUniqueValues(arrWithObjectKey, 'id')).toEqual([]);

      const keyObj = { key: '1' };
      const arrWithSameKeyInstance = [
        { id: keyObj, name: 'apple' },
        { id: { key: '2' }, name: 'banana' },
        { id: keyObj, name: 'orange' },
      ];
      expect(getUniqueValues(arrWithSameKeyInstance, 'id')).toEqual([]);
    });
  });
});

describe('groupBy', () => {
  interface TestObject {
    id?: number | string;
    category?: string | null | undefined | object;
    value: string;
  }

  const sampleObjects: TestObject[] = [
    { id: 1, category: 'A', value: 'Apple' },
    { id: 2, category: 'B', value: 'Banana' },
    { id: 3, category: 'A', value: 'Artichoke' },
    { id: 4, category: 'C', value: 'Cherry' },
    { id: 5, category: 'B', value: 'Blueberry' },
  ];

  describe('basic grouping', () => {
    it('should group an array of objects by a string key (category)', () => {
      const grouped = groupBy(sampleObjects, 'category');
      expect(grouped['A']).toEqual([
        { id: 1, category: 'A', value: 'Apple' },
        { id: 3, category: 'A', value: 'Artichoke' },
      ]);
      expect(grouped['B']).toEqual([
        { id: 2, category: 'B', value: 'Banana' },
        { id: 5, category: 'B', value: 'Blueberry' },
      ]);
      expect(grouped['C']).toEqual([{ id: 4, category: 'C', value: 'Cherry' }]);
    });

    it('should group an array of objects by a number key (id), converting keys to strings', () => {
      const idObjects: TestObject[] = [
        { id: 1, value: 'Item 1' },
        { id: 2, value: 'Item 2' },
        { id: 1, value: 'Item 1 Dupe' },
      ];
      const grouped = groupBy(idObjects, 'id');
      expect(grouped['1']).toEqual([
        { id: 1, value: 'Item 1' },
        { id: 1, value: 'Item 1 Dupe' },
      ]);
      expect(grouped['2']).toEqual([{ id: 2, value: 'Item 2' }]);
    });
  });

  describe('content of groups', () => {
    it('should ensure all items belonging to a group key are present', () => {
      const grouped = groupBy(sampleObjects, 'category');
      expect(grouped['A'].length).toBe(2);
      expect(grouped['A']).toContainEqual({ id: 1, category: 'A', value: 'Apple' });
      expect(grouped['A']).toContainEqual({ id: 3, category: 'A', value: 'Artichoke' });

      expect(grouped['B'].length).toBe(2);
      expect(grouped['B']).toContainEqual({ id: 2, category: 'B', value: 'Banana' });
      expect(grouped['B']).toContainEqual({ id: 5, category: 'B', value: 'Blueberry' });
    });

    it('should ensure items not belonging to a group key are not present', () => {
      const grouped = groupBy(sampleObjects, 'category');
      expect(grouped['A']).not.toContainEqual({ id: 2, category: 'B', value: 'Banana' });
      expect(grouped['C']).not.toContainEqual({ id: 1, category: 'A', value: 'Apple' });
    });
  });

  describe('edge cases', () => {
    it('should return an empty object when grouping an empty array', () => {
      const emptyArr: TestObject[] = [];
      expect(groupBy(emptyArr, 'category')).toEqual({});
    });

    it('should group all items under one key if they all have the same value for the grouping key', () => {
      const sameCategoryObjects: TestObject[] = [
        { category: 'X', value: 'Item 1' },
        { category: 'X', value: 'Item 2' },
        { category: 'X', value: 'Item 3' },
      ];
      const grouped = groupBy(sameCategoryObjects, 'category');
      expect(Object.keys(grouped).length).toBe(1);
      expect(grouped['X']).toEqual(sameCategoryObjects);
    });

    it('should group items into individual keys if they all have different values for the grouping key', () => {
      const differentCategoryObjects: TestObject[] = [
        { category: 'P', value: 'Plum' },
        { category: 'Q', value: 'Quince' },
        { category: 'R', value: 'Raspberry' },
      ];
      const grouped = groupBy(differentCategoryObjects, 'category');
      expect(Object.keys(grouped).length).toBe(3);
      expect(grouped['P']).toEqual([{ category: 'P', value: 'Plum' }]);
      expect(grouped['Q']).toEqual([{ category: 'Q', value: 'Quince' }]);
      expect(grouped['R']).toEqual([{ category: 'R', value: 'Raspberry' }]);
    });

    it('should handle items missing the grouping key (key becomes "undefined")', () => {
      const missingKeyObjects: TestObject[] = [
        { category: 'A', value: 'Item 1' },
        { value: 'Item 2 (no category)' }, // category is undefined
        { category: 'A', value: 'Item 3' },
      ];
      const grouped = groupBy(missingKeyObjects, 'category');
      expect(grouped['A']).toEqual([
        { category: 'A', value: 'Item 1' },
        { category: 'A', value: 'Item 3' },
      ]);
      expect(grouped['undefined']).toEqual([{ value: 'Item 2 (no category)' }]);
    });

    it('should handle null or undefined as grouping key values (keys become "null" or "undefined")', () => {
      const nullUndefinedKeyObjects: TestObject[] = [
        { category: 'A', value: 'Item 1' },
        { category: null, value: 'Item 2 (null category)' },
        { category: undefined, value: 'Item 3 (undefined category)' },
        { category: 'A', value: 'Item 4' },
        { category: null, value: 'Item 5 (null category)' },
      ];
      const grouped = groupBy(nullUndefinedKeyObjects, 'category');
      expect(grouped['A']).toEqual([
        { category: 'A', value: 'Item 1' },
        { category: 'A', value: 'Item 4' },
      ]);
      expect(grouped['null']).toEqual([
        { category: null, value: 'Item 2 (null category)' },
        { category: null, value: 'Item 5 (null category)' },
      ]);
      expect(grouped['undefined']).toEqual([
        { category: undefined, value: 'Item 3 (undefined category)' },
      ]);
    });

    it('should handle object as grouping key value (key becomes string representation like "[object Object]")', () => {
        const objKey = { type: 'complex' };
        const objectKeyObjects: TestObject[] = [
          { category: 'A', value: 'Item 1' },
          { category: objKey, value: 'Item 2 (object category)' },
          { category: 'A', value: 'Item 3' },
        ];
        const grouped = groupBy(objectKeyObjects, 'category');
        expect(grouped['A']).toEqual([
            { category: 'A', value: 'Item 1' },
            { category: 'A', value: 'Item 3' },
        ]);
        // The key will be the string representation of the object
        expect(grouped[String(objKey)]).toEqual([
            { category: objKey, value: 'Item 2 (object category)' }
        ]);
        expect(grouped['[object Object]']).toBeDefined(); // General check
      });
  });
});
