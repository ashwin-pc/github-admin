import {
  Avatar,
  AvatarStack,
  Box,
  Octicon,
  RelativeTime,
  Text,
} from '@primer/react';

import {
  ClockIcon,
  PencilIcon,
  CommentIcon,
  FileDiffIcon,
} from '@primer/octicons-react';
import {
  PullRequest,
  PullRequestReview,
  PullRequestReviewComment,
} from '@octokit/graphql-schema';
import { getColorForNumber, Range } from '../../utils/get_color_for_number';
import React from 'react';
import { Tooltip } from '../Tooltip';
import { getUniqueValues } from '../../utils/common';

interface Activity {
  type: string;
  author: {
    login?: string;
    avatarUrl: string;
  };
  date: string;
}

export const Stats = ({ pr }: { pr: PullRequest }) => {
  // Calculate last activity user and time
  const activities: Activity[] = [
    ...(pr.comments.nodes || []).map((c) => ({
      type: 'Comment',
      author: {
        login: c?.author?.login,
        avatarUrl: c?.author?.avatarUrl,
      },
      date: c?.updatedAt || c?.createdAt,
    })),
    ...(pr.commits.nodes || []).map((c) => ({
      type: 'Commit',
      author: {
        login: c?.commit?.author?.user?.login,
        avatarUrl: c?.commit?.author?.user?.avatarUrl,
      },
      date: c?.commit?.authoredDate,
    })),
    ...(pr.reviews?.nodes || []).map((r) => ({
      type: 'Review',
      author: {
        login: r?.author?.login,
        avatarUrl: r?.author?.avatarUrl,
      },
      date: r?.updatedAt,
    })),
  ];

  // Find the most recent activity
  const mostRecentActivity = activities.reduce(
    (latest, current) =>
      new Date(current.date) > new Date(latest.date) ? current : latest,
    activities[0],
  );

  // Collect comments from reviews, ensuring every step accounts for possible null values
  const unresolvedComments = pr.reviews?.nodes
    ?.filter(
      (review): review is PullRequestReview =>
        review !== null && review !== undefined,
    )
    .reduce(
      (
        total: PullRequestReviewComment[],
        review,
      ): PullRequestReviewComment[] => {
        const comments =
          (review.comments?.nodes?.filter(
            (comment) => !(comment?.isMinimized || comment?.outdated),
          ) as PullRequestReviewComment[]) ?? [];
        return [...total, ...comments];
      },
      [] as PullRequestReviewComment[],
    );

  const unresolvedRanges: Range[] = [
    {
      color: 'danger.fg',
      start: 10,
    },
    {
      color: 'attention.fg',
      start: 5,
    },
  ];

  // Diff Color
  const scaledDiff =
    Math.max(pr.additions, pr.deletions) + pr.changedFiles * 10;
  const diffColor = getColorForNumber(scaledDiff, [
    {
      color: 'success.fg',
      start: 0,
    },
    {
      color: 'attention.fg',
      start: 100,
    },
    {
      color: 'danger.fg',
      start: 200,
    },
  ]);

  return (
    <Box className="stats">
      {/* Opened and Updated time */}
      <Stat
        icon={ClockIcon}
        text={
          <>
            Opened: <RelativeTime datetime={pr.createdAt} />
            {pr.lastEditedAt && (
              <>
                {' '}
                | Updated: <RelativeTime datetime={pr.lastEditedAt} />{' '}
              </>
            )}
          </>
        }
      />
      {/* Last activity by */}
      <Stat
        icon={PencilIcon}
        text={
          <>
            {`Update: ${mostRecentActivity.type} `}
            <RelativeTime datetime={mostRecentActivity.date} />
            {' by '}
            <Avatar
              size={15}
              src={mostRecentActivity.author.avatarUrl}
              aria-label={mostRecentActivity.author.login}
            />
            {` ${mostRecentActivity.author.login}`}
          </>
        }
      />
      {/* Unresolved comments */}
      {unresolvedComments && unresolvedComments.length > 0 && (
        <Stat
          icon={CommentIcon}
          text={
            <Box sx={{ display: 'inline-flex' }}>
              <Text
                as="span"
                color={getColorForNumber(
                  unresolvedComments.length,
                  unresolvedRanges,
                )}
              >
                Unresolved comments: {unresolvedComments.length}
              </Text>
              <Text as="span"> from </Text>
              <Tooltip
                aria-label={`${getUniqueValues(
                  unresolvedComments.map((c) => c.author?.login),
                ).join(', ')}`}
                direction="w"
              >
                <AvatarStack>
                  {getUniqueValues(
                    unresolvedComments.map((c) => c.author?.avatarUrl),
                  ).map((url) => (
                    <Avatar src={url} size={15} />
                  ))}
                </AvatarStack>
              </Tooltip>
            </Box>
          }
        />
      )}
      {/* Changes */}
      <Stat
        icon={FileDiffIcon}
        text={
          <Text color={diffColor}>
            +{pr.additions}, -{pr.deletions}, Files: {pr.changedFiles}
          </Text>
        }
      />
    </Box>
  );
};

const Stat = ({
  text,
  icon,
}: {
  text: string | React.ReactElement;
  icon: any;
}) => (
  <Box className="stat">
    <Octicon icon={icon} size={12} />
    <Text as="span">{text}</Text>
  </Box>
);
