// create a react component called PRRow that takes in a prop called pr of type PullRequest and renders a row with the PR's title, author, and created date in a css grid

import { PullRequest } from '@octokit/graphql-schema';
import {
  RelativeTime,
  Link,
  LabelGroup,
  Label,
  Box,
  Token,
  Truncate,
  Timeline,
  Octicon,
  Tooltip,
} from '@primer/react';
import {
  ClockIcon,
  PencilIcon,
  DotFillIcon,
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
  AlertFillIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  CircleSlashIcon,
  CommentIcon,
} from '@primer/octicons-react';

import './PRRow.css';

const SafeTooltip = Tooltip as unknown as React.ComponentType<any>;

interface PRRowProps {
  pr: PullRequest;
  selectedPR?: PullRequest;
  setSelectedPR: (pr: PullRequest) => void;
}

export const PRRow = ({ pr, selectedPR, setSelectedPR }: PRRowProps) => {
  const checksSuccess = pr.commits.nodes?.[0]?.commit.statusCheckRollup?.state;

  const renderCheckStatus = () => {
    switch (checksSuccess) {
      case 'SUCCESS':
        return (
          <SafeTooltip aria-label="CI passes" direction="e">
            <CheckIcon fill="green" />
          </SafeTooltip>
        );
      case 'FAILURE':
        return (
          <SafeTooltip aria-label="CI Failed" direction="e">
            <XIcon fill="red" />
          </SafeTooltip>
        );
      case 'PENDING':
        return (
          <SafeTooltip aria-label="CI Failed" direction="e">
            <ClockIcon fill="yellow" />
          </SafeTooltip>
        );
      case 'ERROR':
        return (
          <SafeTooltip aria-label="Status check error">
            <AlertFillIcon fill="red" />
          </SafeTooltip>
        );
      case 'EXPECTED':
        return (
          <SafeTooltip aria-label="Expected" direction="e">
            <EyeIcon fill="purple" />
          </SafeTooltip>
        );
      default:
        return <></>;
    }
  };

  return (
    <Box
      className={`row ${selectedPR?.id === pr.id ? 'selected' : ''} ${
        pr.isReadByViewer ? '' : 'unread'
      }`}
      p={2}
      onClick={() => setSelectedPR(pr)}
    >
      <div className="badges">
        {pr.isDraft ? (
          <GitPullRequestDraftIcon fill="grey" />
        ) : (
          <GitPullRequestIcon fill="green" />
        )}
        {pr.mergeable !== 'MERGEABLE' && (
          <SafeTooltip aria-label={pr.mergeable} direction="e">
            <CircleSlashIcon fill="red" />
          </SafeTooltip>
        )}
        {renderCheckStatus()}
      </div>
      <div className="line title">
        <label htmlFor={pr.id}>{pr.title}</label>
      </div>
      <div className="line labels">
        <LabelGroup>
          {pr.labels?.nodes?.map((label) => (
            <Label
              className="label"
              key={label?.name}
              style={{
                borderColor: `#${label?.color}`,
                color: `#${label?.color}`,
                backgroundColor: `#${label?.color}33`,
              }}
            >
              {label?.name}
            </Label>
          ))}
        </LabelGroup>
      </div>
      <div className="line meta">
        <Link
          className="pr_number"
          href={pr.url}
          muted
          underline
          target="_blank"
        >
          #{pr.number}
        </Link>
        <div className="time">
          <div>
            <ClockIcon size={14} fill="#afb8c133" />{' '}
            <RelativeTime date={new Date(pr.createdAt)} />
          </div>
          {pr.lastEditedAt && (
            <div>
              <PencilIcon size={14} fill="#afb8c133" />{' '}
              <RelativeTime date={new Date(pr.lastEditedAt)} />
            </div>
          )}
        </div>
        <div className="author">{pr.author?.login}</div>
      </div>
      <div className="status">
        {pr.viewerLatestReview?.author?.login && (
          <Token className="token" text={pr.viewerLatestReview?.state} />
        )}
      </div>
      <Timeline className="timeline">
        {pr.comments.nodes
          ?.map((comment) => (
            <Timeline.Item condensed="true" key={comment?.id}>
              <Timeline.Badge>
                <Octicon icon={DotFillIcon} />
              </Timeline.Badge>
              <Timeline.Body>
                <Truncate maxWidth={600} title={comment?.bodyText || ''}>
                  <RelativeTime date={new Date(comment?.createdAt)} /> -{' '}
                  {comment?.author?.login}: {comment?.bodyText}
                </Truncate>
              </Timeline.Body>
            </Timeline.Item>
          ))
          .reverse()}
        {pr.comments.totalCount > 0 && (
          <SafeTooltip
            aria-label={`${pr.comments.totalCount} comments`}
            direction="e"
          >
            <Token
              text={pr.comments.totalCount}
              leadingVisual={CommentIcon}
              as="span"
              className="comment-count"
            />
          </SafeTooltip>
        )}
      </Timeline>
    </Box>
  );
};
