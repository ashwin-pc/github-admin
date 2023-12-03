import { useCallback, useEffect, useRef, useState } from 'react';
import { Repository, PullRequest } from '@octokit/graphql-schema';
import { useGithubApiKey } from '../context';
import { PRRow } from '../components/PRRow';
import { Box, Pagination, UnderlineNav } from '@primer/react';
import { GitPullRequestIcon } from '@primer/octicons-react';
import './PullsPage.css';
import { Detail } from '../components/Detail';
import { PageHeader } from '../components/Header';

type RepositoryResponse = { repository: Repository };

export const PRs = () => {
  const { githubApiKey, graphqlWithAuth, owner, repo } = useGithubApiKey();
  const [prevPage, setPrevPage] = useState(1);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const fetching = useRef(false);
  const [totalPRs, setTotalPRs] = useState(0);
  const [selectedPR, setSelectedPR] = useState<PullRequest>(pullRequests[0]);
  const [pageSize, setPageSize] = useState(25);
  const [pageCursors, setPageCursors] = useState<(string | undefined)[]>([
    undefined,
  ]);
  const [currentPage, setCurrentPage] = useState(1);

  // Function to fetch all page cursors
  const fetchPageCursors = useCallback(
    async (totalPRs: number) => {
      let currentCursor = undefined;
      let cursors: Array<string | undefined> = [undefined]; // First page cursor is always undefined
      for (let i = 0; i < Math.ceil(totalPRs / pageSize); i++) {
        const response: RepositoryResponse =
          await graphqlWithAuth<RepositoryResponse>(cursorQuery, {
            owner: owner,
            name: repo,
            first: pageSize,
            after: currentCursor,
          });
        if (response.repository?.pullRequests.pageInfo.endCursor) {
          currentCursor = response.repository.pullRequests.pageInfo.endCursor;
          cursors.push(currentCursor);
        } else {
          break; // No more pages
        }
      }
      setPageCursors(cursors);
    },
    [graphqlWithAuth, owner, pageSize, repo],
  );

  const fetchPullRequests = useCallback(
    async (cursor?: string) => {
      // If we don't have an API key, don't fetch
      if (!githubApiKey || fetching.current) {
        return;
      }
      fetching.current = true;
      const { repository } = await graphqlWithAuth<RepositoryResponse>(query, {
        owner: owner,
        name: repo,
        first: pageSize,
        after: cursor,
      });

      fetching.current = false;

      if (
        !repository ||
        !repository.pullRequests ||
        !repository.pullRequests.nodes
      ) {
        return;
      }

      const newPullRequests = repository.pullRequests.nodes.filter(
        (pr): pr is PullRequest => pr !== null,
      );
      setPullRequests(newPullRequests);

      // If we have multiple pages, fetch all page cursors
      const totalPRs = repository.pullRequests.totalCount || 0;
      const hasMultiplePages = totalPRs && Math.ceil(totalPRs / pageSize);
      if (hasMultiplePages && pageCursors.length === 1) {
        fetchPageCursors(totalPRs);
      }

      setTotalPRs(totalPRs);
    },
    [
      fetchPageCursors,
      githubApiKey,
      graphqlWithAuth,
      owner,
      pageCursors.length,
      pageSize,
      repo,
    ],
  );

  useEffect(() => {
    // If we have a new page, fetch it or if we have no PRs, fetch the first page
    if (prevPage !== currentPage || pullRequests.length === 0) {
      fetchPullRequests(pageCursors[currentPage - 1]);
      setPrevPage(currentPage);
    }
  }, [
    currentPage,
    fetchPullRequests,
    pageCursors,
    prevPage,
    pullRequests.length,
  ]);

  const handlePageChange = (newPage: number) => {
    setPrevPage(currentPage);
    setCurrentPage(newPage);
  };

  useEffect(() => {
    // if there is a changein the owner or repo, reset the page cursors and refetch
    setPageCursors([undefined]);
    setCurrentPage(1);
    fetchPullRequests();
  }, [fetchPullRequests, owner, repo]);

  // TODO: Use this to change page size
  //   const handlePageSizeChange = (newSize: number) => {
  //     setPageSize(newSize);
  //     setPageCursors(['']);
  //     setCurrentPage(1);
  //   };

  return (
    <Box className="page">
      <PageHeader />
      <Box className="nav-bar grid-item">
        <UnderlineNav aria-label="Main">
          <UnderlineNav.Item
            href={`/`}
            aria-current="page"
            counter={totalPRs}
            icon={GitPullRequestIcon}
          >
            Open Pull Requests
          </UnderlineNav.Item>
        </UnderlineNav>
      </Box>
      <Box className="list-view grid-item">
        <Box className="pr-list grid-item">
          {pullRequests.map((pr) => (
            <PRRow
              key={`list-${pr.number}`}
              pr={pr}
              setSelectedPR={setSelectedPR}
              selectedPR={selectedPR}
            />
          ))}
        </Box>
        {pageCursors.length > 1 && (
          <Pagination
            pageCount={pageCursors.length - 1}
            currentPage={currentPage}
            onPageChange={(e, page) => {
              handlePageChange(page);
            }}
            showPages={{
              narrow: false,
            }}
          />
        )}
      </Box>
      <Box className="details-view grid-item">
        <Detail pr={selectedPR} />
      </Box>
    </Box>
  );
};

const query = `
    query GetPullRequests($owner: String!, $name: String!, $first: Int!, $after: String) {
      repository(owner: $owner, name: $name) {
        pullRequests(first: $first, after: $after, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            id
            number
            title
            url
            createdAt
            lastEditedAt
            author {
              login
            }
            labels (first: 10) {
              nodes {
                color
                name
              }
            }
            viewerLatestReview {
              author {
                login
              }
              state
            }
            isDraft
            assignees (first: 10) {
              nodes {
                id
              }
            }
            isReadByViewer
            comments (last: 5) {
              nodes {
                author {
                  login
                }
                bodyText
                createdAt
              }
            }
          }
        }
      }
    }
`;

const cursorQuery = `
  query GetPageCursors($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: $first, after: $after, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
        pageInfo {
          endCursor
        }
      }
    }
  }
`;
