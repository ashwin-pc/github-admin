import { graphql } from '@octokit/graphql';
import React, { createContext, useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import queryString from 'query-string';
import { OWNER, REPO } from '../components/constants';

export const GithubApiKeyContext = createContext<{
  githubApiKey: string | null;
  setGithubApiKey: (apiKey: string | null) => void;
  graphqlWithAuth: typeof graphql;
  owner: string;
  repo: string;
  setOwnerRepo: (owner: string, repo: string) => void;
}>({
  githubApiKey: null,
  setGithubApiKey: (apiKey: string | null) => {},
  graphqlWithAuth: graphql,
  owner: OWNER,
  repo: REPO,
  setOwnerRepo: (owner: string, repo: string) => {},
});

export const GithubApiKeyProvider = (props: any) => {
  const location = useLocation();
  const navigate = useNavigate();

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

  const graphqlWithAuth = useMemo(
    () =>
      graphql.defaults({
        headers: {
          authorization: `token ${githubApiKey}`,
        },
      }),
    [githubApiKey],
  );

  // Wrap the state setter function to update both state and localStorage
  const setGithubApiKey = (apiKey: string | null) => {
    setGithubApiKeyState(apiKey);
    const newQuery = queryString.stringify({
      ...queryString.parse(location.search),
      key: apiKey,
    });
    navigate({ ...location, search: newQuery });
  };

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

  useEffect(() => {
    if (!githubApiKey) {
      navigate('/login');
    }
  }, [githubApiKey, navigate]);

  // listen for changes to the query params and update state if needed
  useEffect(() => {
    const params = queryString.parse(location.search);
    if (params.key) {
      setGithubApiKey(params.key as string);
    }
    if (params.owner) {
      setOwner(params.owner as string);
    }
    if (params.repo) {
      setRepo(params.repo as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return (
    <GithubApiKeyContext.Provider
      value={{
        githubApiKey,
        setGithubApiKey,
        graphqlWithAuth,
        owner,
        repo,
        setOwnerRepo,
      }}
    >
      {props.children}
    </GithubApiKeyContext.Provider>
  );
};

export const useGithubApiKey = () => React.useContext(GithubApiKeyContext);
