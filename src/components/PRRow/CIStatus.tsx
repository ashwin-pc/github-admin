import {
  ClockIcon,
  AlertFillIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
} from '@primer/octicons-react';
import { CheckRun, PullRequest } from '@octokit/graphql-schema';
import { StatusBadge } from './StatusBadge';
import { Tooltip } from '../Tooltip';
import { getUniqueValues, groupBy } from '../../utils/common';

export const CIStatus = ({ pr }: { pr: PullRequest }) => {
  const status = getCIResult(pr);

  const badge = (
    <StatusBadge status={status.text} color={status.color} icon={status.icon} />
  );

  if (status.reason) {
    return <Tooltip text={status.reason}>{badge}</Tooltip>;
  }

  return badge;
};

interface CIResult {
  text: string;
  color: string;
  icon: any;
  reason?: string;
}

const getCIResult = (pr: PullRequest): CIResult => {
  const rollupState = pr.commits.nodes?.[0]?.commit.statusCheckRollup?.state;
  const runs = (pr.commits.nodes?.[0]?.commit.statusCheckRollup?.contexts
    .nodes ?? []) as CheckRun[];
  const dedupedRuns = getUniqueValues(runs, 'name');
  // Gather all the contexts so that the are grouped by status
  const groupByConclusion = groupBy<CheckRun>(dedupedRuns, 'conclusion');
  const groupByStatus = groupBy<CheckRun>(dedupedRuns, 'status');

  switch (rollupState) {
    case 'SUCCESS':
      return {
        text: 'CI passes',
        color: 'success.fg',
        icon: CheckIcon,
      };
    case 'FAILURE':
      return {
        text:
          groupByConclusion?.FAILURE?.length === 1
            ? `${groupByConclusion?.FAILURE[0].name} failed`
            : `${groupByConclusion?.FAILURE?.length} Failures`,
        color: 'danger.fg',
        icon: XIcon,
        reason: groupByConclusion?.FAILURE?.map((context) => context.name).join(
          ', ',
        ),
      };
    case 'PENDING':
      return {
        text: `${groupByStatus?.IN_PROGRESS?.length} checks pending`,
        color: 'attention.fg',
        icon: ClockIcon,
        reason: groupByStatus?.IN_PROGRESS?.map((context) => context.name).join(
          ', ',
        ),
      };
    case 'ERROR':
      return {
        text: 'CI Error',
        color: 'danger.fg',
        icon: AlertFillIcon,
      };
    case 'EXPECTED':
      return {
        text: 'CI Expected',
        color: 'purple.fg',
        icon: EyeIcon,
      };
    default:
      return {
        text: 'No CI status',
        color: 'neutral.fg',
        icon: ClockIcon,
      };
  }
};
