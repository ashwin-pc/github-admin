// react component for a detail pane that shows the details of a PR

import { PullRequest, Repository } from '@octokit/graphql-schema';
import {
  Box,
  Text,
  Link,
  Timeline,
  Octicon,
  Truncate,
  RelativeTime,
  Pagehead,
} from '@primer/react';
import { DotFillIcon } from '@primer/octicons-react';
import { useEffect, useState } from 'react';
import { useGithubApiKey } from '../context';
import { OWNER, REPO } from './constants';

import './Detail.css';

interface DetailProps {
  pr?: PullRequest;
}

export const Detail = ({ pr }: DetailProps) => {
  const { graphqlWithAuth } = useGithubApiKey();
  const [prDetail, setPrDetail] = useState<PullRequest | null>(null);

  useEffect(() => {
    (async () => {
      setPrDetail(null);
      if (!pr) {
        return;
      }

      const { repository } = await graphqlWithAuth<{ repository: Repository }>(
        query,
        {
          owner: OWNER,
          name: REPO,
          number: pr.number,
        },
      );

      if (!repository.pullRequest) {
        return;
      }

      setPrDetail(repository.pullRequest);
    })();
  }, [graphqlWithAuth, pr]);

  if (!pr || !prDetail) {
    return null;
  }

  return (
    <Box className="detail" p={3}>
      <Pagehead fontWeight="bold">
        <Link className="line title" href={pr.url} target="_blank">
          <Text as="span">#{pr.number}</Text> {pr.title}
        </Link>
      </Pagehead>
      <Timeline className="timeline">
        {prDetail.comments.nodes
          ?.map((comment) => (
            <Timeline.Item condensed="true" key={`detail-${comment?.id}`}>
              <Timeline.Badge>
                <Octicon icon={DotFillIcon} />
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
      <Text
        as="div"
        className="pr-body"
        dangerouslySetInnerHTML={{ __html: prDetail.bodyHTML || '' }}
      />
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
                      }
                    createdAt
                    }
                  }
            }
        }
    }
`;
