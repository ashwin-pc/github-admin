import { PullRequest } from '@octokit/graphql-schema';

const BOT_LOGINS = [
  'codecov',
  'dependabot',
  'github-actions',
  'opensearch-changeset-bot[bot]',
  'github-actions[bot]',
];

// Updated return type now includes an optional reviewers array.
export function determinePRState(pr: PullRequest): {
  state: string;
  reason: string;
  reviewers?: { login: string; avatarUrl: string }[];
} {
  if (pr.isDraft)
    return { state: 'Draft', reason: 'The PR is marked as draft.' };
  if (pr.merged) return { state: 'Merged', reason: 'The PR has been merged.' };
  if (pr.state === 'CLOSED')
    return { state: 'Closed', reason: 'The PR is closed.' };

  // Collect all non-bot approved reviews (excluding the author).
  const approvedReviewersRaw =
    pr.reviews?.nodes?.filter(
      (r) =>
        r != null &&
        r.author != null &&
        r.state === 'APPROVED' &&
        // Ensure pr.author is non-null before comparing.
        (pr.author?.login ? r.author.login !== pr.author.login : true) &&
        !BOT_LOGINS.includes(r.author.login.toLowerCase()),
    ) || [];
  // Remove duplicates by login.
  const approvedReviewersMap: Record<string, string> = {};
  approvedReviewersRaw.forEach((r) => {
    if (r && r.author) {
      approvedReviewersMap[r.author.login] = r.author.avatarUrl;
    }
  });
  const approvedReviewers = Object.entries(approvedReviewersMap).map(
    ([login, avatarUrl]) => ({ login, avatarUrl }),
  );

  if (approvedReviewers.length >= 2) {
    const names = approvedReviewers.map((r) => r.login).join(', ');
    return {
      state: 'Approved',
      reason: `Approved by ${names}.`,
      reviewers: approvedReviewers,
    };
  } else if (approvedReviewers.length === 1) {
    const names = approvedReviewers.map((r) => r.login).join(', ');
    return {
      state: 'Review Pending',
      reason: `1 approval from ${names}; at least 2 required for approval.`,
      reviewers: approvedReviewers,
    };
  }

  // Updated timelineItems parsing logic.
  let activities: { time: number; user: string; type: string }[] = [];
  if ((pr as any).timelineItems?.nodes?.length) {
    activities = activities.concat(
      (pr as any).timelineItems.nodes.map((node: any) => {
        let time: number;
        let user = '';
        let type = node.__typename;
        if (type === 'PullRequestCommit') {
          time = new Date(node.commit.authoredDate).getTime();
          user = node.commit.author?.user?.login || '';
        } else {
          time = new Date(node.createdAt || node.updatedAt).getTime();
          if (node.author) user = node.author.login;
          else if (node.assignee) user = node.assignee.login;
        }
        return { time, user, type };
      }),
    );
  }

  if (activities.length > 0) {
    activities.sort((a, b) => a.time - b.time);
    // Find the last non-bot activity.
    let lastActivity;
    for (let i = activities.length - 1; i >= 0; i--) {
      if (!BOT_LOGINS.includes(activities[i].user.toLowerCase())) {
        lastActivity = activities[i];
        break;
      }
    }
    if (!lastActivity) {
      return {
        state: 'Unassigned',
        reason: 'Only bot activities found; no valid reviewer.',
      };
    }
    // Use optional chaining on pr.author.login.
    if (pr.author?.login && lastActivity.user === pr.author.login) {
      return {
        state: 'Review Pending',
        reason: `Last activity (${lastActivity.type}) was by the PR author (${lastActivity.user}).`,
      };
    } else {
      if (lastActivity.type === 'PullRequestReview') {
        const lastReview = pr.reviews?.nodes?.find(
          (r) =>
            r?.author?.login === lastActivity.user &&
            new Date(r!.submittedAt!).getTime() === lastActivity.time,
        );
        if (lastReview && lastReview.state === 'APPROVED')
          return {
            state: 'Review Pending',
            reason: `Last review approved by ${lastActivity.user}.`,
            reviewers: [
              {
                login: lastReview.author!.login,
                avatarUrl: lastReview.author!.avatarUrl,
              },
            ],
          };
        else
          return {
            state: 'Changes Requested',
            reason: `Last review by ${lastActivity.user} did not approve.`,
          };
      } else {
        return {
          state: 'Changes Requested',
          reason: `Last ${lastActivity.type} was by ${lastActivity.user}.`,
        };
      }
    }
  }
  return {
    state: 'Unassigned',
    reason: 'No activity, approvals, or assignees found.',
  };
}
