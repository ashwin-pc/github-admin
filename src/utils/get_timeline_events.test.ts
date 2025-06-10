import { getTimelineEvents, getReviewMessage, Activity } from './get_timeline_events';

// --- Mock GraphQL Types ---
// These are simplified versions of @octokit/graphql-schema types
// including only the fields used by the functions being tested.

interface MockActor {
  login: string;
  avatarUrl?: string; // Optional as it's used by Activity but not all events provide it directly
}

interface MockAssignee {
  __typename?: 'User' | 'Bot' | 'Mannequin' | 'Organization'; // Example assignable types
  login: string;
  avatarUrl?: string;
}


interface MockPullRequestReviewCommentConnection {
  totalCount: number;
}

interface MockPullRequestReview {
  __typename: 'PullRequestReview';
  author?: MockActor | null;
  bodyText: string;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING" | string; // string for other states
  comments: MockPullRequestReviewCommentConnection;
  updatedAt: string; // Assuming ISO date string
  createdAt: string; // Though getReviewMessage doesn't use it, it's common
}

interface MockAssignedEvent {
  __typename: 'AssignedEvent';
  assignee?: MockAssignee | null; // Can be Actor or specific types like User, Bot etc.
  createdAt: string;
}

interface MockCommit {
  abbreviatedOid: string;
  authoredDate: string;
}

interface MockPullRequestCommit {
  __typename: 'PullRequestCommit';
  commit: MockCommit;
  // Note: PullRequestCommit events don't have a direct author field in the same way reviews do.
  // The author is on commit.committer or commit.author, but the function doesn't use it directly for the activity author.
}

interface MockIssueComment {
  __typename: 'IssueComment';
  author?: MockActor | null;
  bodyText: string;
  updatedAt: string;
  createdAt: string;
}

interface MockUnknownEvent {
  __typename: 'UnknownEvent' | 'LabeledEvent' | 'MergedEvent'; // Example of other types
  createdAt?: string; // Some events might have these
  updatedAt?: string;
}


type MockPullRequestTimelineItem =
  | MockPullRequestReview
  | MockAssignedEvent
  | MockPullRequestCommit
  | MockIssueComment
  | MockUnknownEvent;

interface MockPullRequestTimelineItemsConnection {
  nodes?: (MockPullRequestTimelineItem | null)[] | null;
  totalCount?: number;
}

interface MockPullRequest {
  timelineItems?: MockPullRequestTimelineItemsConnection | null;
}

// --- Tests for getReviewMessage ---

describe('getReviewMessage', () => {
  const mockReviewBase: Omit<MockPullRequestReview, 'state' | 'comments' | 'bodyText'> = {
    __typename: 'PullRequestReview',
    author: { login: 'testuser', avatarUrl: 'url' },
    updatedAt: '2023-01-01T12:00:00Z',
    createdAt: '2023-01-01T11:00:00Z',
  };

  describe('APPROVED state', () => {
    it('should return "Approved" if 0 comments', () => {
      const review: MockPullRequestReview = {
        ...mockReviewBase,
        state: 'APPROVED',
        comments: { totalCount: 0 },
        bodyText: '',
      };
      expect(getReviewMessage(review as any)).toBe('Approved');
    });

    it('should return "Approved with X comments" if >0 comments', () => {
      const review: MockPullRequestReview = {
        ...mockReviewBase,
        state: 'APPROVED',
        comments: { totalCount: 3 },
        bodyText: '',
      };
      expect(getReviewMessage(review as any)).toBe('Approved with 3 comments');
    });
  });

  describe('CHANGES_REQUESTED state', () => {
    it('should include bodyText', () => {
      const review: MockPullRequestReview = {
        ...mockReviewBase,
        state: 'CHANGES_REQUESTED',
        comments: { totalCount: 1 }, // Comments might exist
        bodyText: 'Please fix this.',
      };
      expect(getReviewMessage(review as any)).toBe('Changes Requested: Please fix this.');
    });
     it('should include bodyText even if empty', () => {
      const review: MockPullRequestReview = {
        ...mockReviewBase,
        state: 'CHANGES_REQUESTED',
        comments: { totalCount: 0 },
        bodyText: '',
      };
      expect(getReviewMessage(review as any)).toBe('Changes Requested: ');
    });
  });

  describe('COMMENTED state', () => {
    it('should return "Left a comment" if 0 body comments (totalCount refers to line comments)', () => {
      // The function uses review.comments.totalCount, which usually means review comments on lines of code.
      // A "COMMENTED" review state without a main review body comment but with line comments.
      const review: MockPullRequestReview = {
        ...mockReviewBase,
        state: 'COMMENTED',
        comments: { totalCount: 0 }, // Let's assume this means no line comments for this interpretation
        bodyText: '', // No main review comment body
      };
      // If totalCount is 0, it means "Left a comment" (implying the review itself is a comment action)
      expect(getReviewMessage(review as any)).toBe('Left a comment');
    });

    it('should return "Left X comments" if >0 comments', () => {
      const review: MockPullRequestReview = {
        ...mockReviewBase,
        state: 'COMMENTED',
        comments: { totalCount: 5 },
        bodyText: 'General feedback.', // Body text might or might not be there
      };
      expect(getReviewMessage(review as any)).toBe('Left 5 comments');
    });
  });

  describe('Other states', () => {
    it('should return "reviewed" for DISMISSED state', () => {
      const review: MockPullRequestReview = {
        ...mockReviewBase,
        state: 'DISMISSED',
        comments: { totalCount: 0 },
        bodyText: '',
      };
      expect(getReviewMessage(review as any)).toBe('reviewed');
    });

    it('should return "reviewed" for PENDING state', () => {
      const review: MockPullRequestReview = {
        ...mockReviewBase,
        state: 'PENDING',
        comments: { totalCount: 0 },
        bodyText: '',
      };
      expect(getReviewMessage(review as any)).toBe('reviewed');
    });

    it('should return "reviewed" for any other string state', () => {
      const review: MockPullRequestReview = {
        ...mockReviewBase,
        state: 'UNKNOWN_CUSTOM_STATE',
        comments: { totalCount: 0 },
        bodyText: '',
      };
      expect(getReviewMessage(review as any)).toBe('reviewed');
    });
  });
});

// --- Tests for getTimelineEvents ---

describe('getTimelineEvents', () => {
  const mockAuthor: MockActor = { login: 'testuser', avatarUrl: 'http://example.com/avatar.png' };
  const mockAssigneeUser: MockAssignee = { __typename: 'User', login: 'assigneeUser', avatarUrl: 'http://example.com/assignee.png' };

  it('should handle empty timelineItems.nodes gracefully', () => {
    const pr: MockPullRequest = {
      timelineItems: { nodes: [], totalCount: 0 },
    };
    const result = getTimelineEvents(pr as any);
    // The grouping logic `activities[0]` will cause error if activities is empty.
    // Based on current code: if activities is empty, `groupedActivities` will be `[undefined]` then filtered to `[]`.
    expect(result.activities).toEqual([]);
    expect(result.totalEvents).toBe(0);
  });

  it('should handle null timelineItems.nodes', () => {
    const pr: MockPullRequest = {
      timelineItems: { nodes: null, totalCount: 0 },
    };
    const result = getTimelineEvents(pr as any);
    expect(result.activities).toEqual([]);
    expect(result.totalEvents).toBe(0);
  });

  it('should handle null pr.timelineItems', () => {
    const pr: MockPullRequest = {
      timelineItems: null,
    };
    const result = getTimelineEvents(pr as any);
    expect(result.activities).toEqual([]);
    expect(result.totalEvents).toBeUndefined(); // totalCount would be undefined
  });

  it('should filter out null items in timelineItems.nodes', () => {
    const pr: MockPullRequest = {
      timelineItems: {
        nodes: [
          null,
          {
            __typename: 'AssignedEvent',
            assignee: mockAssigneeUser,
            createdAt: '2023-01-01T10:00:00Z',
          } as MockAssignedEvent,
          null,
        ],
        totalCount: 1, // Count of actual event
      },
    };
    const result = getTimelineEvents(pr as any);
    expect(result.activities.length).toBe(1);
    expect(result.activities[0].type).toBe('AssignedEvent');
    expect(result.totalEvents).toBe(1);
  });

  describe('Event type handling', () => {
    it('should process AssignedEvent correctly', () => {
      const pr: MockPullRequest = {
        timelineItems: {
          nodes: [
            {
              __typename: 'AssignedEvent',
              assignee: mockAssigneeUser,
              createdAt: '2023-01-01T10:00:00Z',
            } as MockAssignedEvent,
          ],
          totalCount: 1,
        },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(1);
      const activity = result.activities[0];
      expect(activity.type).toBe('AssignedEvent');
      expect(activity.message).toBe('Assigned to assigneeUser');
      expect(activity.author?.login).toBe('assigneeUser');
      expect(activity.date).toBe('2023-01-01T10:00:00Z');
    });

    it('should process PullRequestReview correctly', () => {
      const reviewItem: MockPullRequestReview = {
        __typename: 'PullRequestReview',
        author: mockAuthor,
        state: 'APPROVED',
        comments: { totalCount: 0 },
        bodyText: '',
        updatedAt: '2023-01-02T10:00:00Z',
        createdAt: '2023-01-02T09:00:00Z',
      };
      const pr: MockPullRequest = {
        timelineItems: { nodes: [reviewItem], totalCount: 1 },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(1);
      const activity = result.activities[0];
      expect(activity.type).toBe('PullRequestReview');
      expect(activity.message).toBe('Approved'); // from getReviewMessage
      expect(activity.author?.login).toBe('testuser');
      expect(activity.date).toBe('2023-01-02T10:00:00Z');
    });

    it('should process PullRequestCommit correctly', () => {
      const commitItem: MockPullRequestCommit = {
        __typename: 'PullRequestCommit',
        commit: {
          abbreviatedOid: 'abc1234',
          authoredDate: '2023-01-03T10:00:00Z',
        },
      };
      const pr: MockPullRequest = {
        timelineItems: { nodes: [commitItem], totalCount: 1 },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(1);
      const activity = result.activities[0];
      expect(activity.type).toBe('PullRequestCommit');
      expect(activity.message).toBe('abc1234');
      expect(activity.date).toBe('2023-01-03T10:00:00Z');
      expect(activity.author).toBeUndefined(); // No direct author on this activity
    });

    it('should process IssueComment correctly', () => {
      const commentItem: MockIssueComment = {
        __typename: 'IssueComment',
        author: mockAuthor,
        bodyText: 'This is a comment.',
        updatedAt: '2023-01-04T10:00:00Z',
        createdAt: '2023-01-04T09:00:00Z',
      };
      const pr: MockPullRequest = {
        timelineItems: { nodes: [commentItem], totalCount: 1 },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(1);
      const activity = result.activities[0];
      expect(activity.type).toBe('IssueComment');
      expect(activity.message).toBe('This is a comment.');
      expect(activity.author?.login).toBe('testuser');
      expect(activity.date).toBe('2023-01-04T10:00:00Z');
    });

    it('should handle unknown event types with a default message', () => {
      const unknownItem: MockUnknownEvent = {
        __typename: 'LabeledEvent', // An example of an unhandled type
        createdAt: '2023-01-05T10:00:00Z',
      };
      const pr: MockPullRequest = {
        timelineItems: { nodes: [unknownItem], totalCount: 1 },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(1);
      const activity = result.activities[0];
      expect(activity.type).toBe('LabeledEvent');
      expect(activity.message).toBe('Unknown event');
      // The date for unknown events is currently set to '', which might be intended or not
      expect(activity.date).toBe('');
    });
     it('should handle events with missing optional author gracefully', () => {
      const reviewItem: MockPullRequestReview = {
        __typename: 'PullRequestReview',
        author: null, // Missing author
        state: 'COMMENTED',
        comments: { totalCount: 1 },
        bodyText: 'A comment',
        updatedAt: '2023-01-02T11:00:00Z',
        createdAt: '2023-01-02T11:00:00Z',
      };
       const pr: MockPullRequest = {
        timelineItems: { nodes: [reviewItem], totalCount: 1 },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(1);
      const activity = result.activities[0];
      expect(activity.author).toBeNull();
    });
  });

  describe('Commit grouping logic', () => {
    const commit1: MockPullRequestCommit = {
      __typename: 'PullRequestCommit',
      commit: { abbreviatedOid: 'c1', authoredDate: '2023-01-03T10:00:00Z' },
    };
    const commit2: MockPullRequestCommit = {
      __typename: 'PullRequestCommit',
      commit: { abbreviatedOid: 'c2', authoredDate: '2023-01-03T11:00:00Z' },
    };
    const commit3: MockPullRequestCommit = {
      __typename: 'PullRequestCommit',
      commit: { abbreviatedOid: 'c3', authoredDate: '2023-01-03T12:00:00Z' },
    };
    const review: MockPullRequestReview = {
        __typename: 'PullRequestReview',
        author: mockAuthor,
        state: 'COMMENTED',
        comments: { totalCount: 1 },
        bodyText: 'Review after commits',
        updatedAt: '2023-01-03T13:00:00Z',
        createdAt: '2023-01-03T13:00:00Z',
      };

    it('should group multiple consecutive PullRequestCommit events', () => {
      const pr: MockPullRequest = {
        timelineItems: { nodes: [commit1, commit2, commit3], totalCount: 3 },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(1);
      const activity = result.activities[0];
      expect(activity.type).toBe('PullRequestCommit');
      expect(activity.message).toBe('c1; c2; c3');
      expect(activity.date).toBe('2023-01-03T12:00:00Z'); // Date of the last commit in group
    });

    it('should not group non-consecutive PullRequestCommit events', () => {
      const pr: MockPullRequest = {
        timelineItems: { nodes: [commit1, review, commit2], totalCount: 3 },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(3);
      expect(result.activities[0].message).toBe('c1');
      expect(result.activities[1].type).toBe('PullRequestReview');
      expect(result.activities[2].message).toBe('c2');
    });

    it('should handle a single PullRequestCommit event (no grouping needed)', () => {
      const pr: MockPullRequest = {
        timelineItems: { nodes: [commit1], totalCount: 1 },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(1);
      expect(result.activities[0].message).toBe('c1');
    });

    it('should correctly group commits when they are the first events', () => {
      const pr: MockPullRequest = {
        timelineItems: { nodes: [commit1, commit2, review], totalCount: 3 },
      };
      const result = getTimelineEvents(pr as any);
      expect(result.activities.length).toBe(2);
      expect(result.activities[0].type).toBe('PullRequestCommit');
      expect(result.activities[0].message).toBe('c1; c2');
      expect(result.activities[0].date).toBe('2023-01-03T11:00:00Z');
      expect(result.activities[1].type).toBe('PullRequestReview');
    });
  });

   it('should handle a PR with only one event', () => {
    const assignEvent: MockAssignedEvent = {
      __typename: 'AssignedEvent',
      assignee: mockAssigneeUser,
      createdAt: '2023-01-01T10:00:00Z',
    };
    const pr: MockPullRequest = {
      timelineItems: { nodes: [assignEvent], totalCount: 1 },
    };
    const result = getTimelineEvents(pr as any);
    expect(result.activities.length).toBe(1);
    expect(result.activities[0].type).toBe('AssignedEvent');
    expect(result.totalEvents).toBe(1);
  });
});
