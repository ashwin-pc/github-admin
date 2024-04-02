import { useCallback, useEffect, useState } from 'react';
import { PullRequest } from '@octokit/graphql-schema';
import { useAppContext } from '../context';
import { Box, Button, UnderlineNav, Spinner, PageLayout } from '@primer/react';
import { GitPullRequestIcon } from '@primer/octicons-react';
import './PullsPage.css';
import { PageHeader, Detail, PRRow, ErrorBoundary } from '../components';
import { Blankslate } from '@primer/react/lib-esm/drafts';
import { SearchBar } from '../components/SearchBar';
import { graphqlWithProxy } from 'src/utils/graphql_proxy';
import { useSearch } from 'src/hooks/useSearch';

export const PRs = () => {
  const { isAuthenticated } = useAppContext();
  const [pageInfo, setPageInfo] = useState<{
    endCursor: string;
    hasNextPage: boolean;
  }>({
    endCursor: '',
    hasNextPage: false,
  });
  const [searchTerm, setSearchTerm] = useSearch(
    `repo:opensearch-project/OpenSearch-Dashboards is:pr is:open`,
  );
  const [isFetching, setIsFetching] = useState(false);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [totalPRs, setTotalPRs] = useState(0);
  const [selectedPR, setSelectedPR] = useState<PullRequest | undefined>(
    pullRequests[0],
  );
  const pageSize = 25;

  // TODO: Save the current search term to local storage whenever it changes
  // useEffect(() => {
  //   // Save the current search term to local storage whenever it changes
  //   localStorage.setItem('searchTerm', searchTerm);
  // }, [searchTerm]);

  const fetchPullRequests = useCallback(
    async (cursor?: string) => {
      if (!isAuthenticated || isFetching || searchTerm?.length === 0) {
        return;
      }
      setIsFetching(true);
      if (!cursor) {
        setPullRequests([]);
      }

      // Use the search query for GraphQL

      try {
        // Start the quick query
        const responsePromise = graphqlWithProxy<{ search: any }>(quickQuery, {
          q: searchTerm,
          first: pageSize,
          after: cursor,
        });

        // Get detailed data
        const detailedResponsePromise = graphqlWithProxy<{ search: any }>(
          detailedQuery,
          {
            q: searchTerm,
            first: pageSize,
            after: cursor,
          },
        );

        const response = await responsePromise;

        if (!response.search || !response.search.nodes) {
          setIsFetching(false);
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

        const detailedResponse = await detailedResponsePromise;
        if (!detailedResponse.search || !detailedResponse.search.nodes) {
          setIsFetching(false);
          return;
        }

        const detailedPullRequests = detailedResponse.search.nodes.filter(
          (pr: any): pr is PullRequest =>
            pr !== null && pr.__typename === 'PullRequest',
        );

        setPullRequests((prev) => {
          // remove the last page of PRs and add the detailed PRs instead
          const newPRs = prev.slice(0, prev.length - newPullRequests.length);
          return [...newPRs, ...detailedPullRequests];
        });

        setPageInfo(response.search.pageInfo);
        setIsFetching(false);
      } catch (error) {
        console.error('Error fetching pull requests:', error);
        setIsFetching(false);
      }
    },
    [isAuthenticated, isFetching, searchTerm],
  );

  useEffect(() => {
    // if there is a change in the owner or repo, reset the page cursors and refetch
    if (isAuthenticated) {
      fetchPullRequests();
    }

    // Disable this warning because we only want to refetch when the page loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isAuthenticated]);

  return (
    <PageLayout
      containerWidth="full"
      sx={{
        bg: 'canvas.default',
        minHeight: '100vh',
      }}
      padding="none"
    >
      <PageLayout.Header>
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
      </PageLayout.Header>
      <PageLayout.Content>
        <Box className="list-view grid-item">
          <SearchBar
            onSearch={(query) => setSearchTerm(query)}
            query={searchTerm}
            loading={isFetching}
          />
          <Box className="pr-list grid-item">
            <ErrorBoundary>
              <>
                {isFetching && pullRequests.length === 0 ? (
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
      </PageLayout.Content>
      <PageLayout.Pane hidden={!selectedPR} resizable sticky>
        <Box className="details-view grid-item">
          <Detail pr={selectedPR} onClose={() => setSelectedPR(undefined)} />
        </Box>
      </PageLayout.Pane>
    </PageLayout>
  );
};

const quickQuery = `
  query SearchPullRequests($q: String!, $first: Int!, $after: String) {
    search(query: $q, type: ISSUE, first: $first, after: $after) {
      issueCount
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        __typename
        ... on PullRequest {
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
          isDraft
        }
      }
    }
  }
`;

const detailedQuery = `
  query SearchPullRequests($q: String!, $first: Int!, $after: String) {
    search(query: $q, type: ISSUE, first: $first, after: $after) {
      issueCount
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        __typename
        ... on PullRequest {
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
          reviews(last: 100) {
            totalCount
            nodes {
              state
              updatedAt
              author {
                login
                avatarUrl
              }
              comments (last: 100) {
                nodes {
                  outdated
                  isMinimized
                  author {
                    login
                    avatarUrl
                  }
                }
              }
            }
          }
          isDraft
          assignees(first: 10) {
            nodes {
              id
              login
              avatarUrl
            }
          }
          comments(last: 1) {
            totalCount
          }
          timelineItems (last: 10, itemTypes: [ASSIGNED_EVENT, PULL_REQUEST_COMMIT, PULL_REQUEST_REVIEW, ISSUE_COMMENT]) {
            totalCount
            nodes {
              __typename
              ... on AssignedEvent {
                createdAt
                assignee {
                  ... on User {
                    avatarUrl
                    login
                  }
                }
              }
              ... on PullRequestReview {
                author {
                  avatarUrl
                  login
                }
                state
                updatedAt
                comments {
                  totalCount
                }
              }
              ... on PullRequestCommit {
                commit {
                  abbreviatedOid
                  authoredDate
                }
              }
              ... on IssueComment {
                author {
                  login
                  avatarUrl
                }
                updatedAt
                bodyText
              }
            }
          }
          commits(last: 1) {
            totalCount
            nodes {
              commit {
                authoredDate
                statusCheckRollup {
                  state
                  contexts (first: 100){
                    totalCount
                    nodes {
                      ... on CheckRun {
                        status
                        name
                        conclusion
                      }
                    }
                  }
                }
                author {
                  user {
                    login
                    avatarUrl
                  }
                }
              }
            }
          }
          additions
          deletions
          changedFiles
        }
      }
    }
  }
`;
