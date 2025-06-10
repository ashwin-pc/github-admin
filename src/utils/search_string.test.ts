import { search } from './search_string';

describe('search object', () => {
  describe('search.add', () => {
    it('should add a key-value pair to an empty string', () => {
      expect(search.add('', 'author', 'john')).toBe('author:john');
    });

    it('should add a key-value pair to a non-empty string', () => {
      expect(search.add('status:open', 'author', 'john')).toBe('status:open author:john');
    });

    it('should replace existing key-value pairs for the same key', () => {
      expect(search.add('author:jane status:closed', 'author', 'john')).toBe('status:closed author:john');
      expect(search.add('author:jane author:doe', 'author', 'john')).toBe('author:john'); // All old 'author' removed
    });

    it('should add a key-value pair at a specific position', () => {
      expect(search.add('status:open sort:date', 'author', 'john', 1)).toBe('status:open author:john sort:date');
      expect(search.add('status:open sort:date', 'author', 'john', 0)).toBe('author:john status:open sort:date');
      expect(search.add('status:open sort:date', 'author', 'john', 2)).toBe('status:open sort:date author:john');
    });

    it('should handle leading/trailing spaces in the input string q (they are normalized by filter(Boolean))', () => {
      expect(search.add(' status:open  ', 'author', 'john')).toBe('status:open author:john');
      expect(search.add(' author:old  status:open ', 'author', 'john')).toBe('status:open author:john');
    });

    it('should add correctly when value contains spaces (no special handling by add, creates "key:value with space")', () => {
      expect(search.add('', 'name', 'John Doe')).toBe('name:John Doe'); // Produces a single string "name:John Doe"
      expect(search.add('repo:foo', 'name', 'John Doe')).toBe('repo:foo name:John Doe');
    });
  });

  describe('search.remove', () => {
    it('should remove a key-value pair from a string', () => {
      expect(search.remove('author:john status:open', 'author')).toBe('status:open');
    });

    it('should attempt to remove a key that doesn\'t exist (string remains unchanged)', () => {
      expect(search.remove('status:open', 'author')).toBe('status:open');
      expect(search.remove('  status:open  ', 'author')).toBe('status:open'); // With filter(Boolean)
    });

    it('should remove a key when multiple different keys exist', () => {
      expect(search.remove('author:john status:open sort:date', 'status')).toBe('author:john sort:date');
    });

    it('should remove all occurrences of a key if it exists multiple times', () => {
      expect(search.remove('author:name1 author:name2 status:open', 'author')).toBe('status:open');
    });

    it('should handle extra spaces between tokens when removing (they are normalized by filter(Boolean))', () => {
      expect(search.remove('author:john   status:open', 'author')).toBe('status:open');
      expect(search.remove('  author:john status:open', 'author')).toBe('status:open');
    });
  });

  describe('search.has', () => {
    it('should return true if the exact key-value pair exists (value has no spaces)', () => {
      expect(search.has('author:john status:open', 'author', 'john')).toBe(true);
    });

    it('should return false if the key-value pair does not exist', () => {
      expect(search.has('author:john status:open', 'reviewer', 'jane')).toBe(false);
    });

    it('should return false if the key exists but with a different value', () => {
      expect(search.has('author:john status:open', 'author', 'jane')).toBe(false);
    });

    it('should return false when checking in an empty string', () => {
      expect(search.has('', 'author', 'john')).toBe(false);
    });

    it('should handle values with spaces (split behavior means it wont find "key:value with space" as one token)', () => {
      // search.add creates "name:John Doe" as a single string.
      // However, search.has will split "name:John Doe" into "name:John" and "Doe" if it's part of a larger query string
      // or even if it's the whole query string.
      // Thus, it cannot find "name:John Doe" as a single token.
      expect(search.has('name:John Doe repo:foo', 'name', 'John Doe')).toBe(false); // This is false because "name:John Doe" is not a token after "John Doe".split by space
      expect(search.has('name:John Doe', 'name', 'John Doe')).toBe(false); // Query "name:John Doe" -> tokens "name:John", "Doe". Target "name:John Doe". No match.

      // It would find "name:John" if that was the intended key-value pair and the query reflected that.
      expect(search.has('name:John repo:foo', 'name', 'John')).toBe(true);
    });
  });

  describe('search.get', () => {
    it('should get a value for a key that exists', () => {
      expect(search.get('author:john status:open', 'author')).toBe('john');
    });

    it('should return an empty string if the key doesn\'t exist', () => {
      expect(search.get('status:open', 'author')).toBe('');
    });

    it('should return the first value if the key is present multiple times', () => {
      expect(search.get('author:name1 author:name2 status:open', 'author')).toBe('name1');
    });

    it('should handle values with colons correctly (returns everything after first colon)', () => {
      expect(search.get('url:http://example.com', 'url')).toBe('http://example.com');
      expect(search.get('config:key:value', 'config')).toBe('key:value');
    });
     it('should correctly get value if value contains spaces (gets first part before space due to split)', () => {
      // If q = "name:John Doe", add would have created this as one string.
      // get will split it into "name:John", "Doe".
      // find(token => token.startsWith("name:")) will find "name:John".
      // substring("name".length + 1) will give "John".
      expect(search.get('name:John Doe', 'name')).toBe('John');
      expect(search.get('name:John Doe repo:test', 'name')).toBe('John');
    });
  });

  describe('search.getKeys', () => {
    it('should get all keys from a string with multiple key-value pairs', () => {
      expect(search.getKeys('author:john status:open sort:date')).toEqual(['author', 'status', 'sort']);
    });

    it('should get keys from a string with one key-value pair', () => {
      expect(search.getKeys('author:john')).toEqual(['author']);
    });

    it('should return an empty array if the string has no key-value pairs (no colons)', () => {
      expect(search.getKeys('open due soon')).toEqual([]);
    });

    it('should return an empty array for an empty string', () => {
      expect(search.getKeys('')).toEqual([]);
    });

    it('should correctly parse keys even if there are tokens without colons', () => {
      expect(search.getKeys('author:john open status:closed sort:date urgent')).toEqual(['author', 'status', 'sort']);
    });
     it('should handle keys when values have spaces (keys are up to colon)', () => {
      expect(search.getKeys('name:John Doe repo:test')).toEqual(['name', 'repo']); // "Doe" is not a key
    });
  });

  describe('search.getValues', () => {
    it('should get all values for a specific key when it appears multiple times', () => {
      expect(search.getValues('author:name1 author:name2 status:open', 'author')).toEqual(['name1', 'name2']);
    });

    it('should get values for a key that appears once', () => {
      expect(search.getValues('author:john status:open', 'author')).toEqual(['john']);
    });

    it('should return an empty array if the key does not exist', () => {
      expect(search.getValues('status:open', 'author')).toEqual([]);
    });

    it('should return an empty array for an empty string', () => {
      expect(search.getValues('', 'author')).toEqual([]);
    });

    it('should correctly parse values which themselves contain colons', () => {
      expect(search.getValues('url:http://example.com label:bug:critical', 'url')).toEqual(['http://example.com']);
      expect(search.getValues('url:http://example.com label:bug:critical', 'label')).toEqual(['bug:critical']);
    });
    it('should get values if values contain spaces (gets first part before space)', () => {
      // If q = "name:John Doe name:Jane Eyre" (manually constructed as add would replace)
      // tokens = ["name:John", "Doe", "name:Jane", "Eyre"]
      // filter(token.startsWith("name:")) -> ["name:John", "name:Jane"]
      // map(token.substring("name".length+1)) -> ["John", "Jane"]
      expect(search.getValues('name:John Doe name:Jane Eyre', 'name')).toEqual(['John', 'Jane']);
    });
  });

  describe('General considerations and space handling (after filter(Boolean))', () => {
    it('should handle queries with multiple spaces between tokens', () => {
      expect(search.add('author:jane   status:open', 'author', 'john')).toBe('status:open author:john');
      expect(search.remove('author:john   status:open', 'author')).toBe('status:open');
      expect(search.has('author:john   status:open', 'author', 'john')).toBe(true);
      expect(search.has('author:john   status:open', 'status', 'open')).toBe(true);
      expect(search.get('author:john   status:open', 'author')).toBe('john');
      expect(search.getKeys('author:john   status:open')).toEqual(['author', 'status']);
      expect(search.getValues('author:john   status:open', 'author')).toEqual(['john']);
    });

    it('should handle queries with leading/trailing spaces', () => {
      const q = ' author:john status:open ';
      expect(search.add(q, 'repo', 'mine')).toBe('author:john status:open repo:mine');
      expect(search.add(q, 'author', 'new')).toBe('status:open author:new');
      expect(search.remove(q, 'author')).toBe('status:open');
      expect(search.has(q, 'author', 'john')).toBe(true);
      expect(search.get(q, 'status')).toBe('open');
      expect(search.getKeys(q)).toEqual(['author', 'status']);
      expect(search.getValues(q, 'author')).toEqual(['john']);
    });

    it('should handle tokens without colons (plain keywords)', () => {
        const q = 'author:john open review:needed urgent';
        expect(search.add(q, 'label', 'bug')).toBe('author:john open review:needed urgent label:bug');
        expect(search.remove(q, 'review')).toBe('author:john open urgent');
        expect(search.has(q, 'author', 'john')).toBe(true);
        expect(search.has(q, 'label', 'bug')).toBe(false);
        expect(search.get(q, 'author')).toBe('john');
        expect(search.get(q, 'urgent')).toBe('');
        expect(search.getKeys(q)).toEqual(['author', 'review']);
        expect(search.getValues(q, 'author')).toEqual(['john']);
    });
  });
});
