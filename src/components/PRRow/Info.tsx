import {
  Link,
  LabelGroup,
  Label,
  Box,
  Text,
  Avatar,
  AvatarStack,
  Spinner, // <-- added Spinner import
} from '@primer/react';
import { Tooltip } from '../Tooltip';
import './index.css';
import { CIStatus } from './CIStatus';
import { MergeStatus } from './MergeStatus';
import { determinePRState } from '../PRRow/ReviewStatus'; // add this if desired
import { getUniqueValues } from '../../utils/common';
import { emitter } from '../../utils/events';
import { PullRequest } from '@octokit/graphql-schema';

export const Info = ({ pr }: { pr: PullRequest }) => {
  // Compute review state to determine status highlighting.
  const reviewState = determinePRState(pr);
  // Set a color based on review state.
  let highlightColor = 'white'; // default is now white instead of 'transparent'
  if (reviewState.state === 'Approved') highlightColor = 'success.fg';
  else if (reviewState.state === 'Review Pending')
    highlightColor = 'attention.fg';

  return (
    <Box className="content">
      <Box
        className="author"
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Avatar
          size={15}
          src={pr.author?.avatarUrl}
          aria-label={pr.author?.login}
          onClick={(e) =>
            emitter.emit('avatar:click', {
              login: pr.author?.login || '',
              type: 'author',
            })
          }
        />
        <Text
          as="span"
          sx={{
            marginLeft: '8px',
            marginRight: '4px',
          }}
        >
          {pr.author?.login}
        </Text>
        {' | '}
        <Tooltip
          aria-label={`Review status: ${reviewState.state}. ${reviewState.reason}`}
          direction="s"
        >
          {!pr.reviews ? (
            <Spinner size="small" />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {reviewState.reviewers && reviewState.reviewers.length > 0 && (
                <AvatarStack
                  sx={{
                    border: `2px solid ${highlightColor}`,
                    padding: '2px',
                    borderRadius: '4px',
                  }}
                >
                  {reviewState.reviewers.map(({ login, avatarUrl }, index) => (
                    <Avatar
                      src={avatarUrl}
                      size={15}
                      key={index}
                      onClick={(e) =>
                        emitter.emit('avatar:click', {
                          login,
                          type: 'reviewer',
                        })
                      }
                    />
                  ))}
                </AvatarStack>
              )}
              <Text
                as="span"
                sx={{
                  marginLeft: '4px',
                  color: highlightColor,
                }}
              >
                {reviewState.state}
              </Text>
            </Box>
          )}
        </Tooltip>
      </Box>
      <Box className="title">
        <Text
          as="span"
          sx={{
            marginRight: '8px',
            color: 'text.primary',
          }}
        >
          {pr.title}
        </Text>
        <Link
          href={pr.url}
          target="_blank"
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
          }}
        >
          #{pr.number}
        </Link>
      </Box>
      <Box className="status">
        <MergeStatus pr={pr} />
        <CIStatus pr={pr} />
      </Box>
      <LabelGroup
        sx={{
          display: 'flex',
        }}
      >
        {pr.labels?.nodes?.map((label) => (
          <Label
            className="label"
            key={label?.name}
            style={{
              borderColor: `#${label?.color}`,
              color: `#${label?.color}`,
              backgroundColor: `#${label?.color}33`,
            }}
            onClick={(e) =>
              emitter.emit('label:click', {
                label: label?.name || '',
                negated: e.shiftKey ? true : false,
              })
            }
          >
            {label?.name}
          </Label>
        ))}
      </LabelGroup>
    </Box>
  );
};
