import { PullRequest } from '@octokit/graphql-schema';
import { Box, Button, UnderlineNav, Spinner, PageLayout } from '@primer/react';
import { GitPullRequestIcon } from '@primer/octicons-react';
import './PullsPage.css';
import { PageHeader, PRRow, ErrorBoundary } from '../components';
import { Blankslate } from '@primer/react/lib-esm/drafts';
import { SearchBar } from '../components/SearchBar';
import { useSearch } from 'src/hooks/useSearch';

export const PRs = () => {
  const {
    loading,
    results: pullRequests,
    searchTerm,
    updateSearchTerm,
    hasMore,
    loadMoreData,
    totalResults: totalPRs,
  } = useSearch<PullRequest>(
    `repo:opensearch-project/OpenSearch-Dashboards is:pr is:open`,
    query,
    {
      first: 20,
    },
    quickQuery,
  );

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
            onSearch={(query) => updateSearchTerm(query)}
            query={searchTerm}
            loading={loading}
          />
          <Box className="pr-list grid-item">
            <ErrorBoundary>
              <>
                {loading && pullRequests.length === 0 ? (
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
                    <PRRow key={`list-${index}`} pr={pr} />
                  ))
                )}
              </>
            </ErrorBoundary>
          </Box>
          <Box className="load-more-container">
            {hasMore && (
              <Button
                variant="invisible"
                disabled={loading}
                onClick={() => loadMoreData()}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            )}
          </Box>
        </Box>
      </PageLayout.Content>
      <PageLayout.Pane hidden={true} resizable sticky>
        <Box className="details-view grid-item">
          {/* Resizeable pane here available for future use */}
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

const query = `
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
                  author {
                    user {
                      login
                      avatarUrl
                    }
                  }
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
