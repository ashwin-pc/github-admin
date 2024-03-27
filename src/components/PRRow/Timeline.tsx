import { PullRequest } from '@octokit/graphql-schema';
import {
  HistoryIcon,
  GitCommitIcon,
  CommentIcon,
} from '@primer/octicons-react';
import {
  Avatar,
  Box,
  Octicon,
  RelativeTime,
  Spinner,
  Timeline,
  Token,
  Truncate,
} from '@primer/react';
import { Tooltip } from '../Tooltip';
import { getTimelineEvents } from '../../utils/get_timeline_events';

export const TimelineSection = ({ pr }: { pr: PullRequest }) => {
  const { activities, totalEvents } = getTimelineEvents(pr);
  // get the last 4 activities in the array
  const subset = activities.slice(-4);

  if (!pr.comments) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Spinner size="small" />
      </Box>
    );
  }

  return (
    <Timeline
      className="timeline"
      sx={{
        backgroundColor: 'canvas.default',
      }}
    >
      {subset
        .map((activity, index) => (
          <Timeline.Item condensed="true" key={index}>
            <Timeline.Badge>
              {activity.author ? (
                <Avatar
                  size={17}
                  src={activity.author.avatarUrl}
                  aria-label={activity.author.login}
                />
              ) : (
                <Octicon icon={GitCommitIcon} size={17} />
              )}
            </Timeline.Badge>
            <Timeline.Body>
              <Truncate maxWidth={600} title={activity.message}>
                <RelativeTime date={new Date(activity.date)} /> -{' '}
                {activity.author?.login}: {activity.message}
              </Truncate>
            </Timeline.Body>
          </Timeline.Item>
        ))
        .reverse()}
      <Box
        sx={{
          position: 'absolute',
          right: '5px',
          bottom: '5px',
          backgroundColor: 'canvas.default',
        }}
      >
        {pr.comments?.totalCount > 0 && (
          <Tooltip
            aria-label={`${pr.comments.totalCount} comments`}
            direction="w"
          >
            <Token
              text={pr.comments.totalCount}
              leadingVisual={CommentIcon}
              as="span"
            />
          </Tooltip>
        )}
        {totalEvents > 0 && (
          <Tooltip aria-label={`${totalEvents} events in total`} direction="w">
            <Token text={totalEvents} leadingVisual={HistoryIcon} as="span" />
          </Tooltip>
        )}
      </Box>
    </Timeline>
  );
};
