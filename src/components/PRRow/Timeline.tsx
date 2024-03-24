import { PullRequest } from '@octokit/graphql-schema';
import { CommentIcon } from '@primer/octicons-react';
import { Avatar, RelativeTime, Timeline, Token, Truncate } from '@primer/react';
import { Tooltip } from '../Tooltip';

export const TimelineSection = ({ pr }: { pr: PullRequest }) => {
  return (
    <Timeline
      className="timeline"
      sx={{
        backgroundColor: 'canvas.default',
      }}
    >
      {pr.comments.nodes
        ?.map((comment) => (
          <Timeline.Item condensed="true" key={comment?.id}>
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
      {pr.comments.totalCount > 0 && (
        <Tooltip
          aria-label={`${pr.comments.totalCount} comments`}
          direction="w"
        >
          <Token
            text={pr.comments.totalCount}
            leadingVisual={CommentIcon}
            as="span"
            sx={{
              position: 'absolute',
              right: '5px',
              bottom: '5px',
              backgroundColor: 'canvas.default',
            }}
          />
        </Tooltip>
      )}
    </Timeline>
  );
};
