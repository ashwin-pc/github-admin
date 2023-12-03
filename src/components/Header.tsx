import {
  Octicon,
  Header,
  Avatar,
  ActionMenu,
  ActionList,
  FormControl,
  TextInput,
  IconButton,
} from '@primer/react';
import { MarkGithubIcon, RepoIcon } from '@primer/octicons-react';
import { useEffect, useState } from 'react';
import { useGithubApiKey } from '../context';
import { OWNER, REPO } from './constants';
import { useStatefulNavigate } from '../utils/use_stateful_navigate';

// Define a type for the GraphQL response
interface GraphqlResponse {
  viewer: {
    avatarUrl: string;
    login: string;
  };
}

export const PageHeader = () => {
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
  const [or, setOr] = useState<string | null>(
    owner && repo ? `${owner}/${repo}` : `${OWNER}/${REPO}`,
  ); // Owner/Repo

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOr(value);
  };

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
        const response = await graphqlWithAuth<GraphqlResponse>(query);
        if (response.viewer) {
          setViewer(response.viewer);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [graphqlWithAuth, githubApiKey]);

  return (
    <Header className="header grid-item">
      <Header.Item>
        <Header.Link
          href={`https://github.com/${owner}/${repo}/pulls`}
          sx={{
            fontSize: 2,
          }}
        >
          <Octicon
            icon={MarkGithubIcon}
            // size={32}
            sx={{
              mr: 2,
            }}
          />
          Github Admin
        </Header.Link>
      </Header.Item>
      <Header.Item>
        <FormControl>
          <TextInput
            sx={{ width: '400px' }}
            placeholder="Owner/Repo"
            onChange={handleInputChange}
            value={or || ''}
            trailingAction={
              <IconButton
                aria-labelledby=""
                icon={RepoIcon}
                as="button"
                onClick={() => {
                  if (or) {
                    const [owner, repo] = or.split('/');
                    setOwnerRepo(owner, repo);
                  }
                }}
              ></IconButton>
            }
          />
        </FormControl>
      </Header.Item>
      <Header.Item full></Header.Item>
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
