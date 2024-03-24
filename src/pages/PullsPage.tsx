import { useCallback, useEffect, useState } from 'react';
import { PullRequest } from '@octokit/graphql-schema';
import { useGithubApiKey } from '../context';
import {
  Box,
  Button,
  UnderlineNav,
  FormControl,
  TextInput,
  Spinner,
} from '@primer/react';
import { SearchIcon, GitPullRequestIcon } from '@primer/octicons-react';
import './PullsPage.css';
import { PageHeader, Detail, PRRow, ErrorBoundary } from '../components';
import { Link } from 'react-router-dom';
import { Blankslate } from '@primer/react/lib-esm/drafts';

export const PRs = () => {
  const { githubApiKey, graphqlWithAuth, owner, repo } = useGithubApiKey();
  const [pageInfo, setPageInfo] = useState<{
    endCursor: string;
    hasNextPage: boolean;
  }>({
    endCursor: '',
    hasNextPage: false,
  });
  const [searchTerm, setSearchTerm] = useState(
    `repo:${owner}/${repo} is:pr is:open`,
  );
  const [isFetching, setIsFetching] = useState(false);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [totalPRs, setTotalPRs] = useState(0);
  const [selectedPR, setSelectedPR] = useState<PullRequest>(pullRequests[0]);
  const pageSize = 25;

  useEffect(() => {
    // const savedSearchTerm = localStorage.getItem('searchTerm');
    setSearchTerm(`repo:${owner}/${repo} is:pr is:open`);
  }, [owner, repo]);

  // TODO: Save the current search term to local storage whenever it changes
  // useEffect(() => {
  //   // Save the current search term to local storage whenever it changes
  //   localStorage.setItem('searchTerm', searchTerm);
  // }, [searchTerm]);

  const fetchPullRequests = useCallback(
    async (cursor?: string) => {
      if (!githubApiKey || isFetching) {
        return;
      }
      setIsFetching(true);
      if (!cursor) {
        setPullRequests([]);
      }

      // Use the search query for GraphQL

      try {
        const response = await graphqlWithAuth<{ search: any }>(searchQuery, {
          q: searchTerm,
          first: pageSize,
          after: cursor,
        });

        setIsFetching(false);

        if (!response.search || !response.search.nodes) {
          return;
        }

        const newPullRequests = response.search.nodes.filter(
          (pr: any): pr is PullRequest =>
            pr !== null && pr.__typename === 'PullRequest',
        );

        setPullRequests((prev) => [...prev, ...newPullRequests]);

        // Since this is a simplified approach, totalCount and pagination may need adjustment
        const totalPRs = response.search.issueCount || 0;
        setTotalPRs(totalPRs);

        setPageInfo(response.search.pageInfo);
      } catch (error) {
        console.error('Error fetching pull requests:', error);
        setIsFetching(false);
      }
    },
    [githubApiKey, isFetching, graphqlWithAuth, searchTerm],
  );

  useEffect(() => {
    // if there is a change in the owner or repo, reset the page cursors and refetch
    fetchPullRequests();

    // Disable this warning because we only want to refetch when the page loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      className="page"
      sx={{
        bg: 'canvas.default',
      }}
    >
      <PageHeader />
      <Box className="nav-bar grid-item">
        <UnderlineNav aria-label="Main">
          <UnderlineNav.Item
            href={`/`}
            aria-current="page"
            counter={totalPRs}
            icon={GitPullRequestIcon}
          >
            Pull Requests
          </UnderlineNav.Item>
        </UnderlineNav>
      </Box>
      <Box className="list-view grid-item">
        <Box className="search-bar-container">
          <FormControl>
            <FormControl.Label>Search</FormControl.Label>
            <FormControl.Caption>
              Can be any query that fetches only pull requests. You can find the
              search syntax guide{' '}
              <Link to="https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests">
                here
              </Link>
            </FormControl.Caption>
            <TextInput
              prefix="Test"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pull requests..."
              width={`100%`}
              trailingAction={
                <TextInput.Action
                  onClick={() => fetchPullRequests()}
                  icon={SearchIcon}
                  sx={{ color: 'gray.5' }}
                />
              }
              onKeyUp={(e) => {
                if (e.key === 'Enter' && !isFetching && !e.shiftKey) {
                  fetchPullRequests();
                }
              }}
            />
          </FormControl>
        </Box>
        <Box className="pr-list grid-item">
          <ErrorBoundary>
            <>
              {isFetching ? (
                <Blankslate>
                  <Blankslate.Visual>
                    <Spinner />
                  </Blankslate.Visual>
                  <Blankslate.Heading>Loading the data!</Blankslate.Heading>
                  <Blankslate.Description>
                    Please wait, we are fetching the data for you.
                  </Blankslate.Description>
                  <Blankslate.PrimaryAction href="#">
                    Reload
                  </Blankslate.PrimaryAction>
                </Blankslate>
              ) : (
                pullRequests.map((pr, index) => (
                  <PRRow
                    key={`list-${index}`}
                    pr={pr}
                    setSelectedPR={setSelectedPR}
                    selectedPR={selectedPR}
                  />
                ))
              )}
            </>
          </ErrorBoundary>
        </Box>
        <Box className="load-more-container">
          {pageInfo.hasNextPage && !isFetching && (
            <Button
              variant="invisible"
              disabled={isFetching}
              onClick={() => fetchPullRequests(pageInfo.endCursor)}
            >
              {isFetching ? 'Loading...' : 'Load More'}
            </Button>
          )}
        </Box>
      </Box>
      <Box className="details-view grid-item">
        <Detail pr={selectedPR} />
      </Box>
    </Box>
  );
};

const searchQuery = `
  query SearchPullRequests($q: String!, $first: Int!, $after: String) {
    search(query: $q, type: ISSUE, first: $first, after: $after) {
      issueCount
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        ... on PullRequest {
          __typename
          id
          number
          mergeable
          merged
          title
          url
          createdAt
          lastEditedAt
          author {
            login
            avatarUrl
          }
          editor {
            login
          }
          labels(first: 10) {
            nodes {
              color
              name
            }
          }
          reviews(first: 1, states: [APPROVED, CHANGES_REQUESTED]) {
            nodes {
              author {
                login
              }
              state
            }
          }
          isDraft
          assignees(first: 10) {
            nodes {
              id
              login
            }
          }
          comments(last: 5) {
            totalCount
            nodes {
              author {
                login
              }
              bodyText
              createdAt
            }
          }
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  state
                }
              }
            }
          }
        }
      }
    }
  }
`;
