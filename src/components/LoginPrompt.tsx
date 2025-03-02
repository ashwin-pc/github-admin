import { Box, Button, Text } from '@primer/react';
import { Blankslate } from '@primer/react/lib-esm/drafts';
import { MarkGithubIcon } from '@primer/octicons-react';

export const LoginPrompt = () => {
  const handleLogin = () => {
    const githubAuthorizationUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${window.location.origin}&scope=repo`;
    window.location.href = githubAuthorizationUrl;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        padding: 4,
      }}
    >
      <Blankslate>
        <Blankslate.Visual>
          <MarkGithubIcon size={24} />
        </Blankslate.Visual>
        <Blankslate.Heading>Authentication Required</Blankslate.Heading>
        <Blankslate.Description>
          <Text>
            You need to log in with GitHub to access this application.
          </Text>
          <Text>Login to view and manage GitHub pull requests.</Text>
        </Blankslate.Description>
        <Button onClick={handleLogin}>Log in with GitHub</Button>
      </Blankslate>
    </Box>
  );
};
