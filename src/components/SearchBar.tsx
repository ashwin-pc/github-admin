import { Box, FormControl, Link, TextInput } from '@primer/react';
import { useEffect, useState } from 'react';
import { SearchIcon } from '@primer/octicons-react';
import { emitter } from '../utils/events';
import { search } from '../utils/search_string';

interface SearchBarProps {
  query: string;
  onSearch: (searchTerm: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const SearchBar = ({
  query,
  onSearch,
  disabled,
  loading,
}: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(query);
  const handleSearch = () => {
    onSearch(searchTerm);
  };

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

  return (
    <Box className="search-bar-container">
      <FormControl>
        <FormControl.Label>Search</FormControl.Label>
        <FormControl.Caption>
          Can be any query that fetches only pull requests. You can find the
          search syntax guide{' '}
          <Link href="https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests">
            here
          </Link>
        </FormControl.Caption>
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
        />
      </FormControl>
    </Box>
  );
};
