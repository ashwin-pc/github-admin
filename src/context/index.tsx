import { graphql } from '@octokit/graphql';
import React, { createContext, useState, useEffect, useMemo, use } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      // First check if this is a redirect from the OAuth flow
      const params = queryString.parse(location.search);
      if (params.code) {
        const { access_token } = await fetch('/api/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: params.code }),
        }).then((res) => res.json());
        navigate('/');
        return;
      }

      // If not a redirect, check if the user is already authenticated
      try {
        const authenticated = await fetch('/api/auth/status').then(
          async (res) => await res.text(),
        );
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    })();
  }, []);

  // Initialize state from localStorage
  const [githubApiKey, setGithubApiKeyState] = useState<string | null>(() => {
    const params = queryString.parse(location.search);
    return params.key as string | null;
  });

  // Initialize owner and repo from query params
  const [owner, setOwner] = useState<string>(() => {
    const params = queryString.parse(location.search);
    return (params.owner as string | null) || OWNER;
  });
  const [repo, setRepo] = useState<string>(() => {
    const params = queryString.parse(location.search);
    return (params.repo as string | null) || REPO;
  });

  const graphqlWithAuth = useMemo(() => graphql.defaults({}), [githubApiKey]);

  const setOwnerRepo = (owner: string, repo: string) => {
    setOwner(owner);
    setRepo(repo);
    const newQuery = queryString.stringify({
      ...queryString.parse(location.search),
      owner,
      repo,
    });
    navigate({ ...location, search: newQuery });
  };

  // listen for changes to the query params and update state if needed
  useEffect(() => {
    const params = queryString.parse(location.search);
    if (params.owner) {
      setOwner(params.owner as string);
    }
    if (params.repo) {
      setRepo(params.repo as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

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
