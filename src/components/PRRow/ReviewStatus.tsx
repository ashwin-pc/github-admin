import { PullRequest } from '@octokit/graphql-schema';
import { StatusBadge } from './StatusBadge';
import { GitPullRequestIcon, XIcon, CheckIcon } from '@primer/octicons-react';
import { Avatar, AvatarStack } from '@primer/react';

export const ReviewStatus = ({ pr }: { pr: PullRequest }) => {
  const reviews = pr.reviews?.nodes || [];
  if (!reviews) {
    return (
      <StatusBadge
        status="No reviews"
        color="neutral.fg"
        icon={GitPullRequestIcon}
      />
    );
  }

  const reviewStates = reviews.map((review) => review?.state) ?? [];
  if (reviewStates.includes('CHANGES_REQUESTED')) {
    return (
      <StatusBadge
        status="Changes requested"
        color="danger.fg"
        icon={GitPullRequestIcon}
      />
    );
  }
  // Two approvals are required for a PR to be approved
  if (reviewStates.filter((state) => state === 'APPROVED').length >= 2) {
    return (
      <StatusBadge status="APPROVED" color="success.fg" icon={CheckIcon} />
    );
  }
  if (reviewStates.includes('APPROVED')) {
    const approvedReview = reviews.filter((r) => r?.state === 'APPROVED');
    const approvedBy = approvedReview.map((r) => r?.author?.avatarUrl ?? '');
    return (
      <StatusBadge
        status={` ${approvedBy?.length} Approved`}
        color="success.fg"
        leadingVisual={() => (
          <AvatarStack>
            {approvedBy.map((url) => (
              <Avatar src={url} size={15} key={url} />
            ))}
          </AvatarStack>
        )}
      />
    );
  }
  return (
    <StatusBadge status="No Approvals" color="attention.fg" icon={XIcon} />
  );
};
