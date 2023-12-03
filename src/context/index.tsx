import { graphql } from '@octokit/graphql';
import React, { createContext, useState, useEffect, useMemo } from 'react';

export const GithubApiKeyContext = createContext<{
  githubApiKey: string | null;
  setGithubApiKey: (apiKey: string | null) => void;
  graphqlWithAuth: typeof graphql;
}>({
  githubApiKey: null,
  setGithubApiKey: (apiKey: string | null) => {},
  graphqlWithAuth: graphql,
});

export const GithubApiKeyProvider = (props: any) => {
  // Initialize state from localStorage
  const [githubApiKey, setGithubApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('githubApiKey');
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

  // Update localStorage whenever the API key changes
  useEffect(() => {
    if (githubApiKey) {
      localStorage.setItem('githubApiKey', githubApiKey);
    } else {
      localStorage.removeItem('githubApiKey');
    }
  }, [githubApiKey]);

  // Wrap the state setter function to update both state and localStorage
  const setGithubApiKey = (apiKey: string | null) => {
    setGithubApiKeyState(apiKey);
  };

  return (
    <GithubApiKeyContext.Provider
      value={{ githubApiKey, setGithubApiKey, graphqlWithAuth }}
    >
      {props.children}
    </GithubApiKeyContext.Provider>
  );
};

export const useGithubApiKey = () => React.useContext(GithubApiKeyContext);
