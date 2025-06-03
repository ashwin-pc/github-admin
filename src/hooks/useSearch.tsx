import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { graphqlWithProxy } from 'src/utils/graphql_proxy';
import { useAppContext } from 'src/context';

type UpdaterFunction = (value: string) => string;

export const useSearch = <T,>(
  defaultSearchTerm = '',
  graphqlQuery,
  queryVariables = {},
  quickQuery?: string,
) => {
  const { isAuthenticated } = useAppContext();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<T[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState(null);
  const fetchIdRef = useRef(0); // Used to track the latest fetch request

  useEffect(() => {
    const getInitialValues = () => {
      if (typeof window === 'undefined') {
        return {
          searchTerm: defaultSearchTerm,
          selectedAuthors: [],
          availableAuthors: [],
        };
      }
      const query = new URLSearchParams(window.location.search);
      const searchTerm = query.get('q') || defaultSearchTerm;
      const selectedAuthors = query.get('authors')?.split(',').filter(Boolean) || [];
      const availableAuthors = query.get('authorList')?.split(',').filter(Boolean) || [];
      
      return { searchTerm, selectedAuthors, availableAuthors };
    };

    const { searchTerm, selectedAuthors, availableAuthors } = getInitialValues();
    setSearchTerm(searchTerm);
    setSelectedAuthors(selectedAuthors);
    setAvailableAuthors(availableAuthors);
  }, [defaultSearchTerm]);

  const updateURL = (term: string, authors: string[], authorList: string[]) => {
    const url = new URL(window.location.href);
    url.searchParams.set('q', term);
    url.searchParams.set('authors', authors.join(','));
    url.searchParams.set('authorList', authorList.join(','));
    window.history.pushState({}, '', url.toString());
  };

  const updateSearchTerm = (valueOrUpdater: string | UpdaterFunction) => {
    const newTerm =
      typeof valueOrUpdater === 'function'
        ? valueOrUpdater(searchTerm)
        : valueOrUpdater;
    setSearchTerm(newTerm);
    updateURL(newTerm, selectedAuthors, availableAuthors);
  };

  const updateSelectedAuthors = (authors: string[]) => {
    setSelectedAuthors(authors);
    updateURL(searchTerm, authors, availableAuthors);
  };

  const updateAvailableAuthors = (authors: string[]) => {
    setAvailableAuthors(authors);
    updateURL(searchTerm, selectedAuthors, authors);
  };

  const buildSearchQuery = () => {
    let query = searchTerm;
    if (selectedAuthors.length > 0) {
      const authorQuery = selectedAuthors.map(author => `author:${author}`).join(' ');
      query = query ? `${query} ${authorQuery}` : authorQuery;
    }
    return query;
  };

  const fetchData = async (loadMore = false) => {
    const finalQuery = buildSearchQuery();
    if (!finalQuery || !isAuthenticated) return;
    const currentFetchId = ++fetchIdRef.current; // Increment and store the current fetch ID
    setLoading(true);

    try {
      const responsePromise = graphqlWithProxy(graphqlQuery, {
        ...queryVariables,
        q: finalQuery,
        after: loadMore ? endCursor : null,
      });

      if (quickQuery) {
        const quickPromise = graphqlWithProxy(quickQuery, {
          ...queryVariables,
          q: finalQuery,
          after: loadMore ? endCursor : null,
        });

        const quickestResponse = await Promise.any([
          responsePromise,
          quickPromise,
        ]);

        if (currentFetchId !== fetchIdRef.current) return;

        const result = quickestResponse.search;
        const newResults = loadMore
          ? [...results, ...result.nodes]
          : result.nodes;
        setResults(newResults);
        setTotalResults(result.issueCount);
      }

      const response = await responsePromise;
      // Before updating the state, check if this is the latest request
      if (currentFetchId === fetchIdRef.current) {
        const result = response.search;
        const newResults = loadMore
          ? [...results, ...result.nodes]
          : result.nodes;
        setResults(newResults);
        setTotalResults(result.issueCount);

        setEndCursor(result.pageInfo.endCursor);
        setHasMore(result.pageInfo.hasNextPage);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Only update state if this is the latest request
      if (currentFetchId === fetchIdRef.current) {
        // Handle latest request error (e.g., by setting an error state, not shown here)
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };

  const loadMoreData = () => {
    if (hasMore && !loading) {
      fetchData(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedAuthors, isAuthenticated]);

  useEffect(() => {
    const handleRouteChange = () => {
      const query = new URLSearchParams(window.location.search);
      const term = query.get('q') || '';
      const authors = query.get('authors')?.split(',').filter(Boolean) || [];
      const authorList = query.get('authorList')?.split(',').filter(Boolean) || [];
      setSearchTerm(term);
      setSelectedAuthors(authors);
      setAvailableAuthors(authorList);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [router]);

  return {
    searchTerm,
    updateSearchTerm,
    selectedAuthors,
    availableAuthors,
    updateSelectedAuthors,
    updateAvailableAuthors,
    loading,
    results,
    fetchData,
    loadMoreData,
    hasMore,
    totalResults,
  };
};
