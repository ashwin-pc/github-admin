import {
  PullRequest,
  PullRequestReview,
  PullRequestTimelineItems,
} from '@octokit/graphql-schema';

export interface Activity {
  type?: PullRequestTimelineItems['__typename'];
  author?: {
    login: string;
    avatarUrl: string;
  } | null;
  date: string;
  message: string;
}

export const getTimelineEvents = (pr: PullRequest) => {
  const events = pr.timelineItems?.nodes || [];
  const filteredEvents = events.filter(Boolean) as PullRequestTimelineItems[];

  const activities: Activity[] = filteredEvents.map((item): Activity => {
    const activity = {
      type: item.__typename,
    };

    switch (item.__typename) {
      case 'AssignedEvent':
        return {
          ...activity,
          date: item.createdAt,
          author: item.assignee,
          message: `Assigned to ${item.assignee?.login}`,
        };
      case 'PullRequestReview':
        return {
          ...activity,
          date: item.updatedAt,
          author: item.author,
          message: getReviewMessage(item),
        };

      case 'PullRequestCommit':
        return {
          ...activity,
          date: item.commit.authoredDate,
          message: `${item.commit.abbreviatedOid}`,
        };
      case 'IssueComment':
        return {
          ...activity,
          date: item.updatedAt,
          author: item.author,
          message: item.bodyText,
        };
      default:
        return {
          ...activity,
          date: '',
          message: 'Unknown event',
        };
    }
  });

  if (activities.length === 0) {
    return {
      activities: [],
      totalEvents: pr.timelineItems?.totalCount,
    };
  }

  const groupedActivities = activities.reduce((acc, activity) => {
    if (acc.length === 0) {
      acc.push(activity);
    } else {
      const lastActivity = acc[acc.length - 1];
      if (
        lastActivity.type === activity.type &&
        activity.type === 'PullRequestCommit'
      ) {
        lastActivity.message += `; ${activity.message}`;
        lastActivity.date = activity.date; // Use the latest date
      } else {
        acc.push(activity);
      }
    }
    return acc;
  }, [] as Activity[]);

  return {
    activities: groupedActivities,
    totalEvents: pr.timelineItems?.totalCount,
  };
};

export function getReviewMessage(review: PullRequestReview) {
  const commentCount = review.comments.totalCount;
  switch (review.state) {
    case 'APPROVED':
      return commentCount > 0
        ? `Approved with ${commentCount} comments`
        : 'Approved';
    case 'CHANGES_REQUESTED':
      return `Changes Requested: ${review.bodyText}`;
    case 'COMMENTED':
      return commentCount > 0
        ? `Left ${commentCount} comments`
        : 'Left a comment';
    default:
      return 'reviewed';
  }
}
