import { PullRequest } from '@octokit/graphql-schema';
import { StatusBadge } from './StatusBadge';
import {
  GitPullRequestIcon,
  GitPullRequestDraftIcon,
  GitMergeIcon,
} from '@primer/octicons-react';

export const MergeStatus = ({ pr }: { pr: PullRequest }) => {
  // Draft PRs are marked separately
  if (pr.isDraft) {
    return (
      <StatusBadge
        status="Draft PR"
        color="neutral.fg"
        icon={GitPullRequestDraftIcon}
      />
    );
  }

  // Check if it is already merged
  if (pr.merged) {
    return (
      <StatusBadge status="Merged PR" color="done.fg" icon={GitMergeIcon} />
    );
  }

  // Mergeable status
  switch (pr.mergeable) {
    case 'MERGEABLE':
      return (
        <StatusBadge
          status="Mergeable PR"
          color="success.fg"
          icon={GitPullRequestIcon}
        />
      );
    case 'CONFLICTING':
      return (
        <StatusBadge
          status="Merge Conflict"
          color="danger.fg"
          icon={GitMergeIcon}
        />
      );
    case 'UNKNOWN':
      return (
        <StatusBadge
          status="Merge status unknown"
          color="attention.fg"
          icon={GitPullRequestIcon}
        />
      );
    default:
      return <></>;
  }
};
