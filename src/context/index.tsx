import React, { createContext, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { graphqlWithProxy } from 'src/utils/graphql_proxy';

interface GraphqlResponse {
  viewer: {
    avatarUrl: string;
    login: string;
  };
}

export const AppContext = createContext<{
  isAuthenticated: boolean;
  viewer?: GraphqlResponse['viewer'];
}>({
  isAuthenticated: false,
});

export const AppProvider = (props: any) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewer, setViewer] = useState<GraphqlResponse['viewer']>();
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
      }

      // Check if the user is already authenticated
      try {
        const result = await fetch('/api/auth/status');
        const isAuthenticated = result.ok;
        setIsAuthenticated(isAuthenticated);
      } catch (error) {
        setIsAuthenticated(false);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const query = `
            query {
              viewer {
                avatarUrl
                login
              }
            }
          `;
      try {
        const response = await graphqlWithProxy<GraphqlResponse>(query);
        if (response.viewer) {
          setViewer(response.viewer);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        viewer,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
