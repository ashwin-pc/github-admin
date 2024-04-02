import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type UpdaterFunction = (prevTerm: string) => string;

export const useSearch = (
  defaultSearchTerm = '',
): [string, (valueOrUpdater: string | UpdaterFunction) => void] => {
  const router = useRouter();

  // Function to get the initial search term from URL or use default
  const getInitialSearchTerm = () => {
    if (typeof window === 'undefined') {
      return defaultSearchTerm; // Return default if window is not defined (e.g., during SSR)
    }
    const query = new URLSearchParams(window.location.search);
    return query.get('q') || defaultSearchTerm;
  };

  const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);

  useEffect(() => {
    const handleRouteChange = () => {
      const query = new URLSearchParams(window.location.search);
      const term = query.get('q') || '';
      setSearchTerm(term);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [router]);

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

  return [searchTerm, updateSearchTerm];
};
