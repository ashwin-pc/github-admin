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
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<T[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState(null);
  const fetchIdRef = useRef(0); // Used to track the latest fetch request

  useEffect(() => {
    const getInitialSearchTerm = () => {
      if (typeof window === 'undefined') {
        return defaultSearchTerm;
      }
      const query = new URLSearchParams(window.location.search);
      return query.get('q') || defaultSearchTerm;
    };

    setSearchTerm(getInitialSearchTerm());
  }, [defaultSearchTerm]);

  const updateSearchTerm = (valueOrUpdater: string | UpdaterFunction) => {
    const newTerm =
      typeof valueOrUpdater === 'function'
        ? valueOrUpdater(searchTerm)
        : valueOrUpdater;
    setSearchTerm(newTerm);
    const url = new URL(window.location.href);
    url.searchParams.set('q', newTerm);
    window.history.pushState({}, '', url.toString());
  };

  const fetchData = async (loadMore = false) => {
    if (!searchTerm || !isAuthenticated) return;
    const currentFetchId = ++fetchIdRef.current; // Increment and store the current fetch ID
    setLoading(true);

    try {
      const responsePromise = graphqlWithProxy(graphqlQuery, {
        ...queryVariables,
        q: searchTerm,
        after: loadMore ? endCursor : null,
      });

      if (quickQuery) {
        const quickPromise = graphqlWithProxy(quickQuery, {
          ...queryVariables,
          q: searchTerm,
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
  }, [searchTerm, isAuthenticated]);

  useEffect(() => {
    const handleRouteChange = () => {
      const query = new URLSearchParams(window.location.search);
      const term = query.get('q') || '';
      setSearchTerm(term);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [router]);

  return {
    searchTerm,
    updateSearchTerm,
    loading,
    results,
    fetchData,
    loadMoreData,
    hasMore,
    totalResults,
  };
};
