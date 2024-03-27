// react component for a detail pane that shows the details of a PR

import { PullRequest, Repository } from '@octokit/graphql-schema';
import {
  Box,
  Text,
  Link,
  Timeline,
  Truncate,
  RelativeTime,
  Pagehead,
  Avatar,
} from '@primer/react';
import { useEffect, useState } from 'react';
import { useAppContext } from '../context';
import './Detail.css';
import { graphqlWithProxy } from 'src/utils/graphql_proxy';

interface DetailProps {
  pr?: PullRequest;
  onClose: () => void;
}

export const Detail = ({ pr, onClose }: DetailProps) => {
  const { owner, repo } = useAppContext();
  const [prDetail, setPrDetail] = useState<PullRequest | null>(null);

  useEffect(() => {
    (async () => {
      setPrDetail(null);
      if (!pr) {
        return;
      }

      try {
        const { repository } = await graphqlWithProxy<{
          repository: Repository;
        }>(query, {
          owner: owner,
          name: repo,
          number: pr.number,
        });

        if (!repository.pullRequest) {
          return;
        }

        setPrDetail(repository.pullRequest);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [owner, pr, repo]);

  if (!pr || !prDetail) {
    return null;
  }

  return (
    <Box className="detail">
      <Pagehead fontWeight="bold">
        <Link className="line title" href={pr.url} target="_blank" muted>
          <Text as="span">
            #{pr.number} {pr.title}
          </Text>
        </Link>
      </Pagehead>
      <Timeline className="timeline">
        {prDetail.comments.nodes
          ?.map((comment) => (
            <Timeline.Item condensed="true" key={`detail-${comment?.id}`}>
              <Timeline.Badge>
                <Avatar
                  size={17}
                  src={comment?.author?.avatarUrl}
                  aria-label={comment?.author?.login}
                />
              </Timeline.Badge>
              <Timeline.Body>
                <Truncate maxWidth={600} title={comment?.bodyText || ''}>
                  <RelativeTime date={new Date(comment?.createdAt)} /> -{' '}
                  {comment?.author?.login}: {comment?.bodyText}
                </Truncate>
              </Timeline.Body>
            </Timeline.Item>
          ))
          .reverse()}
      </Timeline>
      <Box>
        <Text
          as="div"
          className="pr-body"
          dangerouslySetInnerHTML={{ __html: prDetail.bodyHTML || '' }}
        />
      </Box>
    </Box>
  );
};

const query = `
  query GetPullRequest($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        bodyHTML
        comments (first: 100){
          totalCount
          nodes {
            bodyText
            author {
              login
              avatarUrl
            }
            createdAt
          }
        }
      }
    }
  }
`;
