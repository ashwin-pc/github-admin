import { PullRequest, PullRequestTimelineItems } from '@octokit/graphql-schema';

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
  const events = pr.timelineItems.nodes || [];
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
          message: `${item.state} by ${item.author?.login}`,
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

  const groupedActivities = activities.reduce(
    (acc, activity) => {
      if (
        acc[acc.length - 1].type === activity.type &&
        activity.type === 'PullRequestCommit'
      ) {
        acc[acc.length - 1].message += `; ${activity.message}`;
      } else {
        acc.push(activity);
      }
      return acc;
    },
    [activities[0]],
  );

  return {
    activities: groupedActivities,
    totalEvents: pr.timelineItems.totalCount,
  };
};
