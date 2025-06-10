import { getColorForNumber, Range } from './get_color_for_number';

describe('getColorForNumber', () => {
  const sampleRanges: Range[] = [
    { start: 0, color: 'blue' },
    { start: 10, color: 'green' },
    { start: 20, color: 'red' },
  ];

  const sampleRangesWithNegatives: Range[] = [
    { start: -20, color: 'purple' },
    { start: -10, color: 'orange' },
    { start: 0, color: 'yellow' },
  ];

  describe('basic functionality', () => {
    it('should return the correct color for a value clearly within a defined range', () => {
      expect(getColorForNumber(5, sampleRanges)).toBe('blue');
      expect(getColorForNumber(15, sampleRanges)).toBe('green');
      expect(getColorForNumber(25, sampleRanges)).toBe('red'); // Last range is open-ended
    });

    it('should return the correct color for values in different ranges', () => {
      expect(getColorForNumber(0, sampleRanges)).toBe('blue');
      expect(getColorForNumber(10, sampleRanges)).toBe('green');
      expect(getColorForNumber(20, sampleRanges)).toBe('red');
    });
  });

  describe('boundary conditions', () => {
    it('should return the correct color for a value equal to the start of a range', () => {
      expect(getColorForNumber(0, sampleRanges)).toBe('blue');
      expect(getColorForNumber(10, sampleRanges)).toBe('green');
      expect(getColorForNumber(20, sampleRanges)).toBe('red');
    });

    it('should return the correct color for a value just below the start of a subsequent range', () => {
      expect(getColorForNumber(9.99, sampleRanges)).toBe('blue');
      expect(getColorForNumber(19.99, sampleRanges)).toBe('green');
    });
  });

  describe('values outside ranges', () => {
    it('should return undefined for a value below the start of the first range', () => {
      expect(getColorForNumber(-5, sampleRanges)).toBeUndefined();
      expect(getColorForNumber(-0.01, sampleRanges)).toBeUndefined();
    });

    it('should return the last ranges color for a value above the start of the last range (last range is open-ended)', () => {
      expect(getColorForNumber(30, sampleRanges)).toBe('red');
      expect(getColorForNumber(1000, sampleRanges)).toBe('red');
    });

    it('should return undefined if value is below the start of the first range (with negative ranges)', () => {
        expect(getColorForNumber(-30, sampleRangesWithNegatives)).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should return undefined when given an empty ranges array', () => {
      expect(getColorForNumber(5, [])).toBeUndefined();
    });

    it('should handle overlapping ranges (first applicable sorted range wins)', () => {
      const overlappingRanges: Range[] = [
        { start: 0, color: 'blue' },
        { start: 5, color: 'yellow' }, // Overlaps with blue from 5-9.99...
        { start: 10, color: 'green' },
      ];
      // Function sorts them: 0-blue, 5-yellow, 10-green
      expect(getColorForNumber(3, overlappingRanges)).toBe('blue');
      expect(getColorForNumber(5, overlappingRanges)).toBe('yellow'); // 5 is >= 5 (yellow) and < 10 (green)
      expect(getColorForNumber(7, overlappingRanges)).toBe('yellow');
      expect(getColorForNumber(10, overlappingRanges)).toBe('green');

      const overlappingRanges2: Range[] = [
        { start: 10, color: 'green' },
        { start: 0, color: 'blue' }, // Unsorted
        { start: 5, color: 'yellow' },
      ];
      // Sorted: 0-blue, 5-yellow, 10-green
      expect(getColorForNumber(6, overlappingRanges2)).toBe('yellow');
    });

    it('should handle ranges that are not pre-sorted', () => {
      const unsortedRanges: Range[] = [
        { start: 20, color: 'red' },
        { start: 0, color: 'blue' },
        { start: 10, color: 'green' },
      ];
      expect(getColorForNumber(5, unsortedRanges)).toBe('blue');
      expect(getColorForNumber(15, unsortedRanges)).toBe('green');
      expect(getColorForNumber(25, unsortedRanges)).toBe('red');
    });

    it('should correctly handle negative numbers as values and in range definitions', () => {
      expect(getColorForNumber(-15, sampleRangesWithNegatives)).toBe('purple'); // Corrected: was 'orange'
      expect(getColorForNumber(-20, sampleRangesWithNegatives)).toBe('purple');
      expect(getColorForNumber(-5, sampleRangesWithNegatives)).toBe('orange'); // -5 is >= -10 (orange) and < 0 (yellow)
      expect(getColorForNumber(0, sampleRangesWithNegatives)).toBe('yellow');
      expect(getColorForNumber(5, sampleRangesWithNegatives)).toBe('yellow'); // Last range is open-ended
    });

    it('should handle a single range correctly', () => {
        const singleRange: Range[] = [{ start: 100, color: 'pink' }];
        expect(getColorForNumber(50, singleRange)).toBeUndefined();
        expect(getColorForNumber(100, singleRange)).toBe('pink');
        expect(getColorForNumber(200, singleRange)).toBe('pink');
    });

    it('should handle ranges with identical start points (first one in sorted list wins)', () => {
        const rangesForSameStartTest: Range[] = [
            { start: 0, color: 'blue' },
            { start: 10, color: 'green' },
            { start: 10, color: 'black' },
            { start: 20, color: 'red' }
        ];
        expect(getColorForNumber(10, rangesForSameStartTest)).toBe('black');
        expect(getColorForNumber(15, rangesForSameStartTest)).toBe('black');

         const rangesForSameStartTest2: Range[] = [
            { start: 0, color: 'blue' },
            { start: 10, color: 'black' },
            { start: 10, color: 'green' },
            { start: 20, color: 'red' }
        ];
        expect(getColorForNumber(10, rangesForSameStartTest2)).toBe('green');
        expect(getColorForNumber(15, rangesForSameStartTest2)).toBe('green');
    });
  });
});
