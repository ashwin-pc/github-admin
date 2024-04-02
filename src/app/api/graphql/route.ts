import { cookies } from 'next/headers';
import { graphql } from '@octokit/graphql';

// Function to initialize Octokit with the access token
const getGraphqlWithAuth = (token) =>
  graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const graphqlWithAuth = getGraphqlWithAuth(token.value);

  try {
    // Assume the request body contains the query and variables
    const { query, variables } = await request.json();

    // Forward the query to the GitHub GraphQL API
    const data = await graphqlWithAuth(query, variables);

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching data from GitHub', error);
    return new Response('Error fetching data from GitHub', { status: 500 });
  }
}
