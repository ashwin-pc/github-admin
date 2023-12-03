export async function validateGithubApiKey(apiKey: string): Promise<boolean> {
  const url = 'https://api.github.com/user';
  const headers = {
    Authorization: `token ${apiKey}`,
  };

  try {
    const response = await fetch(url, { headers });

    if (response.ok) {
      // The API key is valid
      const userData = await response.json();
      console.log('API Key is valid. User data:', userData);
      return true;
    } else {
      // The API key is invalid or some other error occurred
      console.error(
        'API Key validation failed:',
        response.status,
        response.statusText,
      );
      return false;
    }
  } catch (error) {
    console.error('Error during API Key validation:', error);
    return false;
  }
}
