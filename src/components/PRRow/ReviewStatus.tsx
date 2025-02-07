import { PullRequest } from '@octokit/graphql-schema';
import { StatusBadge } from './StatusBadge';
import {
  GitPullRequestIcon,
  GitPullRequestDraftIcon,
  GitMergeIcon,
  CheckIcon,
  XIcon,
} from '@primer/octicons-react';
import { Avatar, AvatarStack } from '@primer/react';
import { Tooltip } from '../Tooltip';
import { determinePRState } from 'src/utils/determine_review_status';

export const ReviewStatus = ({ pr }: { pr: PullRequest }) => {
  const result = determinePRState(pr);

  // Map state to badge color and icon.
  let color = 'attention.fg';
  let icon = GitPullRequestIcon;
  switch (result.state) {
    case 'Draft':
      color = 'neutral.fg';
      icon = GitPullRequestDraftIcon;
      break;
    case 'Merged':
      color = 'done.fg';
      icon = GitMergeIcon;
      break;
    case 'Closed':
      color = 'danger.fg';
      icon = XIcon;
      break;
    case 'Approved':
      color = 'success.fg';
      icon = CheckIcon;
      break;
    case 'Review Pending':
      color = 'attention.fg';
      icon = GitPullRequestIcon;
      break;
    case 'Changes Requested':
      color = 'danger.fg';
      icon = XIcon;
      break;
    default:
      color = 'neutral.fg';
      icon = GitPullRequestIcon;
  }

  // Updated leadingVisual using AvatarStack with border color to reflect the fill color.
  const leadingVisual =
    result.reviewers && result.reviewers.length > 0
      ? () => (
          <AvatarStack>
            {result.reviewers!.map((r) => (
              <Avatar
                key={r.login}
                size={16}
                src={r.avatarUrl}
                alt={r.login}
                sx={{
                  marginRight: 2,
                  border: '2px solid',
                  borderColor: color,
                }}
              />
            ))}
          </AvatarStack>
        )
      : undefined;

  const badge = (
    <StatusBadge
      status={result.state}
      color={color}
      icon={icon}
      leadingVisual={leadingVisual}
    />
  );
  return result.reason ? (
    <Tooltip text={result.reason}>{badge}</Tooltip>
  ) : (
    badge
  );
};
