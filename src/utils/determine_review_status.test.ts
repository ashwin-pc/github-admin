import { determinePRState } from './determine_review_status';

export {};

describe('determinePRState', () => {
  it('should return Draft for a draft PR', () => {
    const pr = {
      isDraft: true,
      merged: false,
      state: 'OPEN',
      author: { login: 'user1' },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Draft');
  });

  it('should return Merged for a merged PR', () => {
    const pr = {
      isDraft: false,
      merged: true,
      state: 'OPEN',
      author: { login: 'user1' },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Merged');
  });

  it('should return Closed for a closed PR', () => {
    const pr = {
      isDraft: false,
      merged: false,
      state: 'CLOSED',
      author: { login: 'user1' },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Closed');
  });

  it('should return Approved when there are at least two approved reviews', () => {
    const pr = {
      isDraft: false,
      merged: false,
      state: 'OPEN',
      author: { login: 'author' },
      reviews: {
        nodes: [
          {
            author: { login: 'reviewer1', avatarUrl: 'url1' },
            state: 'APPROVED',
            submittedAt: '2023-01-01T00:00:00Z',
          },
          {
            author: { login: 'reviewer2', avatarUrl: 'url2' },
            state: 'APPROVED',
            submittedAt: '2023-01-02T00:00:00Z',
          },
          // Duplicate entry to test deduplication.
          {
            author: { login: 'reviewer1', avatarUrl: 'url1' },
            state: 'APPROVED',
            submittedAt: '2023-01-03T00:00:00Z',
          },
        ],
      },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Approved');
    expect(result.reviewers?.length).toBe(2);
  });

  it('should return Review Pending when there is exactly one approved review', () => {
    const pr = {
      isDraft: false,
      merged: false,
      state: 'OPEN',
      author: { login: 'author' },
      reviews: {
        nodes: [
          {
            author: { login: 'reviewer1', avatarUrl: 'url1' },
            state: 'APPROVED',
            submittedAt: '2023-01-01T00:00:00Z',
          },
        ],
      },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Review Pending');
    expect(result.reviewers?.length).toBe(1);
  });

  it('should return Review Pending if last activity is by PR author', () => {
    const commonTime = new Date('2023-01-01T00:00:00Z').getTime();
    const pr = {
      isDraft: false,
      merged: false,
      state: 'OPEN',
      author: { login: 'author' },
      reviews: { nodes: [] },
      timelineItems: {
        nodes: [
          {
            __typename: 'PullRequestReview',
            createdAt: '2023-01-01T00:00:00Z',
            author: { login: 'author' },
          },
        ],
      },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Review Pending');
    expect(result.reason).toMatch(/PR author/);
  });

  it('should return Changes Requested if last review is not approved', () => {
    const commonTime = new Date('2023-01-02T00:00:00Z').toISOString();
    const pr = {
      isDraft: false,
      merged: false,
      state: 'OPEN',
      author: { login: 'author' },
      reviews: {
        nodes: [
          {
            author: { login: 'reviewer1', avatarUrl: 'url1' },
            state: 'CHANGES_REQUESTED',
            submittedAt: commonTime,
          },
        ],
      },
      timelineItems: {
        nodes: [
          {
            __typename: 'PullRequestReview',
            createdAt: commonTime,
            author: { login: 'reviewer1' },
          },
        ],
      },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Changes Requested');
  });

  it('should return Unassigned when no valid activities exist', () => {
    const pr = {
      isDraft: false,
      merged: false,
      state: 'OPEN',
      author: { login: 'author' },
      reviews: { nodes: [] },
      // timelineItems missing or empty.
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Unassigned');
  });
});

describe('determinePRState additional timelineItems tests', () => {
  it('should return Unassigned when only bot timeline activities exist', () => {
    const pr = {
      isDraft: false,
      merged: false,
      state: 'OPEN',
      author: { login: 'author' },
      reviews: { nodes: [] },
      timelineItems: {
        nodes: [
          {
            __typename: 'PullRequestReview',
            createdAt: '2023-01-01T00:00:00Z',
            author: { login: 'codecov' },
          },
          {
            __typename: 'PullRequestCommit',
            commit: {
              authoredDate: '2023-01-02T00:00:00Z',
              author: { user: { login: 'dependabot' } },
            },
          },
        ],
      },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Unassigned');
    expect(result.reason).toMatch(/Only bot activities/);
  });

  it('should return Changes Requested if last timeline item is a non-author PullRequestCommit', () => {
    const pr = {
      isDraft: false,
      merged: false,
      state: 'OPEN',
      author: { login: 'author' },
      reviews: { nodes: [] },
      timelineItems: {
        nodes: [
          {
            __typename: 'PullRequestCommit',
            commit: {
              authoredDate: '2023-01-03T00:00:00Z',
              author: { user: { login: 'committer1' } },
            },
          },
        ],
      },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Changes Requested');
    expect(result.reason).toMatch(/Last PullRequestCommit was by committer1/);
  });

  it('should return Review Pending for a timeline PullRequestReview event with approved review', () => {
    const submittedAt = '2023-01-04T00:00:00Z';
    const submittedTime = new Date(submittedAt).getTime();
    const pr = {
      isDraft: false,
      merged: false,
      state: 'OPEN',
      author: { login: 'author' },
      reviews: {
        nodes: [
          {
            author: { login: 'reviewer1', avatarUrl: 'url1' },
            state: 'APPROVED',
            submittedAt,
          },
        ],
      },
      timelineItems: {
        nodes: [
          {
            __typename: 'PullRequestReview',
            createdAt: submittedAt,
            author: { login: 'reviewer1' },
          },
        ],
      },
    };
    const result = determinePRState(pr as any);
    expect(result.state).toBe('Review Pending');
    expect(result.reason).toMatch(/approval from reviewer1/);
    expect(result.reviewers?.[0].login).toBe('reviewer1');
  });
});
