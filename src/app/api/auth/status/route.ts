import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // Assuming the access token is stored in a cookie
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const githubResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token.value}`,
      },
    });

    if (githubResponse.ok) {
      // The token is valid
      return new Response('Authorized', { status: 200 });
    } else {
      // The token is invalid or expired
      return new Response('Unauthorized', { status: 401 });
    }
  } catch (error) {
    console.error('Error validating GitHub token:', error);
    return new Response('Error validating GitHub token', { status: 500 });
  }
}
