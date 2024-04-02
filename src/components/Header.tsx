import {
  Octicon,
  Header,
  Avatar,
  ActionMenu,
  ActionList,
  FormControl,
  useTheme,
  IconButton,
} from '@primer/react';
import { MarkGithubIcon, MoonIcon, SunIcon } from '@primer/octicons-react';
import { useAppContext } from '../context';

export const PageHeader = () => {
  const { setColorMode, colorMode } = useTheme();
  const { isAuthenticated, viewer } = useAppContext();

  return (
    <Header className="header grid-item">
      <Header.Item>
        <Header.Link href="https://github.com/ashwin-pc/github-admin">
          <Octicon
            icon={MarkGithubIcon}
            sx={{
              mr: 2,
            }}
          />
          Github Admin
        </Header.Link>
      </Header.Item>
      <Header.Item full></Header.Item>
      {/* Dark mode toggle */}
      <Header.Item>
        <FormControl>
          <FormControl.Label id="darkModeLabel" visuallyHidden>
            Dark Mode
          </FormControl.Label>
          <IconButton
            aria-label="Toggle dark mode"
            onClick={() =>
              setColorMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
            }
            icon={colorMode === 'dark' ? SunIcon : MoonIcon}
          />
        </FormControl>
      </Header.Item>
      <Header.Item
        sx={{
          mr: 0,
        }}
      >
        <ActionMenu>
          <ActionMenu.Button>
            <Avatar
              src={viewer?.avatarUrl || `https://github.com/octocat.png`}
              size={20}
              square
              alt="@octocat"
            />{' '}
            {viewer?.login ||
              (isAuthenticated ? 'anonymous' : 'Unauthenticated')}
          </ActionMenu.Button>
          <ActionMenu.Overlay width="medium">
            <ActionList>
              {isAuthenticated ? (
                <ActionList.Item
                  onClick={() => {
                    window.location.href = `https://github.com/settings/connections/applications/${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}`;
                  }}
                >
                  Revoke Access
                </ActionList.Item>
              ) : (
                <ActionList.Item
                  onClick={() => {
                    const githubAthorizationUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${window.location.origin}&scope=repo`;
                    window.location.href = githubAthorizationUrl;
                  }}
                >
                  Login
                </ActionList.Item>
              )}
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Header.Item>
    </Header>
  );
};
