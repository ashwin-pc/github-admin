interface GraphQLParams {
  query: string;
  variables?: Record<string, any>;
}

async function graphqlWithProxy<T = any>(
  query: string,
  variables: Record<string, any> = {},
): Promise<T> {
  try {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorInfo = await response.json();
      throw new Error(errorInfo.error || 'Failed to fetch data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GraphQL query failed:', error);
    throw error;
  }
}

export { graphqlWithProxy };
