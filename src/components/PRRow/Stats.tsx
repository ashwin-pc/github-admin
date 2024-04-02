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
  CommentIcon,
  FileDiffIcon,
  PencilIcon,
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

export const Stats = ({ pr }: { pr: PullRequest }) => {
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
          <Text>
            Opened: <RelativeTime datetime={pr.createdAt} />
          </Text>
        }
      />
      {pr.lastEditedAt && (
        <Stat
          icon={PencilIcon}
          text={
            <Text>
              Updated: <RelativeTime datetime={pr.lastEditedAt} />
            </Text>
          }
        />
      )}
      {/* Unresolved comments */}
      {unresolvedComments && unresolvedComments.length > 0 && (
        <Stat
          icon={CommentIcon}
          text={
            <Text
              as="span"
              color={getColorForNumber(
                unresolvedComments.length,
                unresolvedRanges,
              )}
            >
              Open comments: {unresolvedComments.length} from
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
                    <Avatar src={url} size={15} key={url} />
                  ))}
                </AvatarStack>
              </Tooltip>
            </Text>
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
    <Text as="span" sx={{ paddingLeft: '5px' }}>
      {text}
    </Text>
  </Box>
);
