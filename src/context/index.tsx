import React, { createContext, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import queryString from 'query-string';
import { OWNER, REPO } from '../components/constants';

export const AppContext = createContext<{
  isAuthenticated: boolean;
  owner: string;
  repo: string;
  setOwnerRepo: (owner: string, repo: string) => void;
}>({
  isAuthenticated: false,
  owner: OWNER,
  repo: REPO,
  setOwnerRepo: (owner: string, repo: string) => {},
});

export const AppProvider = (props: any) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      // First check if this is a redirect from the OAuth flow
      const code = searchParams.get('code');
      if (code) {
        const { access_token } = await fetch('/api/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        }).then((res) => res.json());
        router.push('/');

        return;
      }

      debugger;
      // If not a redirect, check if the user is already authenticated
      try {
        const result = await fetch('/api/auth/status');
        const isAuthenticated = result.ok;
        setIsAuthenticated(isAuthenticated);
      } catch (error) {
        setIsAuthenticated(false);
      }
    })();
  }, []);

  // Initialize owner and repo from query params
  const [owner, setOwner] = useState<string>(() => {
    const params = queryString.parse(location.search);
    return (params.owner as string | null) || OWNER;
  });
  const [repo, setRepo] = useState<string>(() => {
    const params = queryString.parse(location.search);
    return (params.repo as string | null) || REPO;
  });

  const setOwnerRepo = (owner: string, repo: string) => {
    setOwner(owner);
    setRepo(repo);
    // TODO: carry over the other params
    router.push(`/?owner=${owner}&repo=${repo}`);
  };

  // listen for changes to the query params and update state if needed
  useEffect(() => {
    if (searchParams.has('owner')) {
      setOwner(searchParams.get('owner') as string);
    }
    if (searchParams.has('repo')) {
      setRepo(searchParams.get('repo') as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        owner,
        repo,
        setOwnerRepo,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
