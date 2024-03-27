export async function POST(request: Request) {
  const { code } = await request.json();

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  try {
    const githubResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      },
    );

    const data = await githubResponse.json();

    if (data.access_token) {
      return new Response(JSON.stringify({ access_token: data.access_token }), {
        headers: {
          'Set-Cookie': `token=${data.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/`,
        },
      });
    } else {
      console.error(
        'Failed to exchange code for access token',
        data,
        process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        process.env.GITHUB_CLIENT_SECRET,
      );
      return new Response(JSON.stringify(data), { status: 400 });
    }
  } catch (error) {
    console.error('Failed to exchange code for access token', error);
    return new Response('Failed to exchange code for access token', {
      status: 500,
    });
  }
}
