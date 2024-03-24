import {
  Octicon,
  Header,
  Avatar,
  ActionMenu,
  ActionList,
  FormControl,
  Autocomplete,
  useTheme,
  IconButton,
} from '@primer/react';
import { Repository } from '@octokit/graphql-schema';
import { MarkGithubIcon, MoonIcon, SunIcon } from '@primer/octicons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGithubApiKey } from '../context';
import { useStatefulNavigate } from '../utils/use_stateful_navigate';

// Define a type for the GraphQL response
interface GraphqlResponse {
  viewer: {
    avatarUrl: string;
    login: string;
    repositories: {
      nodes: Repository[];
    };
  };
}

export const PageHeader = () => {
  const { setColorMode, colorMode } = useTheme();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [viewer, setViewer] = useState<GraphqlResponse['viewer'] | null>(null);
  const navigate = useStatefulNavigate();
  const {
    graphqlWithAuth,
    githubApiKey,
    setGithubApiKey,
    owner,
    repo,
    setOwnerRepo,
  } = useGithubApiKey();

  useEffect(() => {
    const fetchUserDataAndRepos = async () => {
      const query = `
            query {
              viewer {
                avatarUrl
                login
                repositories(first: 10, orderBy: {field: PUSHED_AT, direction: DESC}) {
                  nodes {
                    name
                    url
                    owner {
                      login
                    }
                  }
                }
              }
            }
          `;
      try {
        const response = await graphqlWithAuth<GraphqlResponse>(query);
        if (response.viewer) {
          setViewer(response.viewer);
          setRepositories(response.viewer.repositories.nodes);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserDataAndRepos();
  }, [graphqlWithAuth, githubApiKey]);

  const onSelectedChange = useCallback(
    (selectedItems: any) => {
      if (Array.isArray(selectedItems)) {
        const selectedItem: any = selectedItems.find(
          (item) => !!item?.text && item.text !== `${owner}/${repo}`,
        );
        if (!selectedItem) {
          return;
        }
        const [newOwner, newRepo] = selectedItem.text.split('/');
        setOwnerRepo(newOwner, newRepo);
      }
    },
    [owner, repo, setOwnerRepo],
  );

  const selectedRepo = useMemo(
    () => repositories.find((r) => r.owner.login === owner && r.name === repo),
    [repositories, owner, repo],
  );

  return (
    <Header className="header grid-item">
      <Header.Item>
        <Header.Link
          href={`https://github.com/${owner}/${repo}/pulls`}
          sx={{
            fontSize: 2,
          }}
          target="_blank"
        >
          <Octicon
            icon={MarkGithubIcon}
            sx={{
              mr: 2,
            }}
          />
          Github Admin
        </Header.Link>
      </Header.Item>
      <Header.Item>
        <FormControl>
          <FormControl.Label id="autocompleteLabel" visuallyHidden>
            Repository
          </FormControl.Label>
          <Autocomplete>
            <Autocomplete.Input
              placeholder="Select a repository"
              sx={{ width: '500px' }}
              value={`${owner}/${repo}`}
            />
            <Autocomplete.Overlay
              sx={{
                width: '500px',
              }}
            >
              <Autocomplete.Menu
                items={repositories.map((r) => ({
                  text: `${r.owner.login}/${r.name}`,
                  id: r.url, // Using URL as ID for uniqueness, adjust as needed
                }))}
                selectedItemIds={[selectedRepo?.url]} // Using URL for matching, adjust as needed
                onSelectedChange={(items) => onSelectedChange(items)}
                aria-labelledby="autocompleteLabel"
                selectionVariant="single"
              />
            </Autocomplete.Overlay>
          </Autocomplete>
        </FormControl>
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
            {viewer?.login || 'anonymous'}
          </ActionMenu.Button>
          <ActionMenu.Overlay width="medium">
            <ActionList>
              <ActionList.Item
                onSelect={() => navigate('/login', { key: githubApiKey })}
              >
                Change access key
              </ActionList.Item>

              <ActionList.Divider />
              <ActionList.Item
                variant="danger"
                onSelect={() => setGithubApiKey(null)}
              >
                Clear access key
              </ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Header.Item>
    </Header>
  );
};
