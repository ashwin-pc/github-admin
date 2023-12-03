import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Repository, PullRequest } from '@octokit/graphql-schema';
import { useGithubApiKey } from '../context';
import { PRRow } from './PRRow';
import { Box, Button, Heading } from '@primer/react';
import './PRs.css';
import { Detail } from './Detail';
import { OWNER, REPO } from './constants';

export const PRs = () => {
  const { githubApiKey, graphqlWithAuth } = useGithubApiKey();
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const fetching = useRef(false);
  const [selectedPR, setSelectedPR] = useState<PullRequest>(pullRequests[0]);
  const [pageSize, setPageSize] = useState(10);
  const [endCursor, setEndCursor] = useState<string | null | undefined>(null);

  const fetchPullRequests = useCallback(
    async (afterCursor?: string) => {
      fetching.current = true;
      const { repository } = await graphqlWithAuth<{ repository: Repository }>(
        query,
        {
          owner: OWNER,
          name: REPO,
          first: pageSize,
          after: afterCursor,
        },
      );

      fetching.current = false;

      if (
        !repository ||
        !repository.pullRequests ||
        !repository.pullRequests.nodes
      ) {
        return;
      }

      const pullRequests = repository.pullRequests.nodes.filter(
        (pr): pr is PullRequest => pr !== null,
      );
      setPullRequests((prevPRs) => [...prevPRs, ...pullRequests]);
      setEndCursor(repository.pullRequests.pageInfo.endCursor);
    },
    [graphqlWithAuth],
  );

  useEffect(() => {}, [pullRequests]);

  const loadMorePullRequests = () => {
    if (endCursor) {
      fetchPullRequests(endCursor);
    }
  };

  useEffect(() => {
    if (!pullRequests.length) {
      return;
    }

    setSelectedPR(pullRequests[0]);
  }, [pullRequests]);

  useEffect(() => {
    if (!githubApiKey || pullRequests.length || fetching.current) {
      return;
    }

    fetchPullRequests();
  }, [fetchPullRequests, fetching, githubApiKey, pullRequests.length]);

  return (
    <Box className="page">
      <Heading className="page-title grid-item">Pull Requests</Heading>
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
        <Button
          variant="primary"
          size="small"
          className="load-more"
          onClick={loadMorePullRequests}
        >
          Load more
        </Button>
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
                comments (last: 2) {
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
