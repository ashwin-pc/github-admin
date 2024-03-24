import {
  ClockIcon,
  AlertFillIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
} from '@primer/octicons-react';
import { PullRequest } from '@octokit/graphql-schema';
import { StatusBadge } from './StatusBadge';

export const CIStatus = ({ pr }: { pr: PullRequest }) => {
  const checksSuccess = pr.commits.nodes?.[0]?.commit.statusCheckRollup?.state;

  switch (checksSuccess) {
    case 'SUCCESS':
      return (
        <StatusBadge status="CI passes" color="success.fg" icon={CheckIcon} />
      );
    case 'FAILURE':
      return <StatusBadge status="CI Failed" color="danger.fg" icon={XIcon} />;
    case 'PENDING':
      return (
        <StatusBadge
          status="CI Pending"
          color="attention.fg"
          icon={ClockIcon}
        />
      );
    case 'ERROR':
      return (
        <StatusBadge status="CI Error" color="danger.fg" icon={AlertFillIcon} />
      );
    case 'EXPECTED':
      return (
        <StatusBadge status="CI Expected" color="purple.fg" icon={EyeIcon} />
      );
    default:
      return <></>;
  }
};
