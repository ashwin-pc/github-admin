import { Box, FormControl, Link, TextInput } from '@primer/react';
import { useEffect, useState } from 'react';
import { SearchIcon } from '@primer/octicons-react';
import { emitter } from '../utils/events';
import { search } from '../utils/search_string';
import { useAppContext } from 'src/context';
import { Filters } from './Filters';
import { AuthorFilter } from './AuthorFilter';

interface SearchBarProps {
  query: string;
  onSearch: (searchTerm: string) => void;
  disabled?: boolean;
  loading?: boolean;
  selectedAuthors?: string[];
  availableAuthors?: string[];
  onAuthorsChange?: (authors: string[]) => void;
  onAvailableAuthorsChange?: (authors: string[]) => void;
  addNewAuthorsToFilter?: (authorsToAdd: string[]) => void;
  removeAuthorFromFilter?: (authorToRemove: string) => void;
}

export const SearchBar = ({
  query,
  onSearch,
  disabled,
  loading,
  selectedAuthors = [],
  availableAuthors = [],
  onAuthorsChange,
  onAvailableAuthorsChange,
  addNewAuthorsToFilter,
  removeAuthorFromFilter,
}: SearchBarProps) => {
  const { viewer } = useAppContext();
  const [searchTerm, setSearchTerm] = useState(query);
  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const repo = search.get(searchTerm, 'repo');

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  useEffect(() => {
    emitter.on('avatar:click', ({ login, type }) => {
      const newQuery = search.add(searchTerm, type, login);
      setSearchTerm(newQuery);
      onSearch(newQuery);
    });

    emitter.on('label:click', ({ label, negated }) => {
      const newQuery = search.add(
        searchTerm,
        negated ? `-label` : 'label',
        label,
      );
      setSearchTerm(newQuery);
      onSearch(newQuery);
    });
    return () => {
      emitter.off('avatar:click');
    };
  }, [searchTerm, onSearch]);

  const handleFilter = (key: string, value: string) => {
    const newQuery = search.add(searchTerm, key, value);
    setSearchTerm(newQuery);
    onSearch(newQuery);
  };

  return (
    <Box className="search-bar-container">
      <FormControl>
        <FormControl.Label>Search</FormControl.Label>
        <FormControl.Caption>
          Search for pull requests
          {repo && (
            <>
              {' '}
              in{' '}
              <Link
                href={`https://github.com/${repo}/pulls/?q=${search.remove(
                  searchTerm,
                  'repo',
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {repo}
              </Link>
            </>
          )}
          .{' '}
          <Link href="https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests">
            Here's
          </Link>{' '}
          a guide for the search syntax.
        </FormControl.Caption>
        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
          <Filters onFilter={handleFilter} />
          {onAuthorsChange && onAvailableAuthorsChange && addNewAuthorsToFilter && removeAuthorFromFilter && (
            <AuthorFilter
              selectedAuthors={selectedAuthors}
              availableAuthors={availableAuthors}
              onAuthorsChange={onAuthorsChange}
              onAvailableAuthorsChange={onAvailableAuthorsChange}
              addNewAuthorsToFilter={addNewAuthorsToFilter}
              removeAuthorFromFilter={removeAuthorFromFilter}
            />
          )}
          <TextInput
            prefix="Test"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pull requests..."
            width={`100%`}
            loading={loading}
            disabled={disabled}
            trailingAction={
              <TextInput.Action
                onClick={() => handleSearch()}
                icon={SearchIcon}
              />
            }
            onKeyUp={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSearch();
              }
            }}
            sx={{
              paddingLeft: 0,
            }}
          />
        </Box>
      </FormControl>
    </Box>
  );
};
