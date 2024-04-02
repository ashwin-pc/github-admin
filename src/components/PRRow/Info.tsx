import {
  Link,
  LabelGroup,
  Label,
  Box,
  Text,
  Avatar,
  AvatarStack,
} from '@primer/react';
import { Tooltip } from '../Tooltip';
import './index.css';
import { CIStatus } from './CIStatus';
import { MergeStatus } from './MergeStatus';
import { ReviewStatus } from './ReviewStatus';
import { getUniqueValues } from '../../utils/common';
import { emitter } from '../../utils/events';
import { PullRequest } from '@octokit/graphql-schema';

export const Info = ({ pr }: { pr: PullRequest }) => {
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
        {(pr?.assignees?.nodes?.length || 0) > 0 ? (
          <Tooltip
            aria-label={getUniqueValues(
              (pr.assignees?.nodes || []).map((assignee) => assignee?.login),
            ).join(', ')}
            direction="s"
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text
              as="span"
              sx={{
                marginLeft: '4px',
                marginRight: '8px',
              }}
            >
              Assigned:{' '}
            </Text>
            <AvatarStack>
              {getUniqueValues(
                (pr.assignees?.nodes || []).map((assignee) => {
                  return {
                    login: assignee?.login || '',
                    avatarUrl: assignee?.avatarUrl || '',
                  };
                }),
                'login',
              ).map(({ login, avatarUrl }, index) => (
                <Avatar
                  src={avatarUrl}
                  size={15}
                  key={index}
                  onClick={(e) =>
                    emitter.emit('avatar:click', {
                      login,
                      type: 'assignee',
                    })
                  }
                />
              ))}
            </AvatarStack>
          </Tooltip>
        ) : (
          <Text
            as="span"
            sx={{
              marginLeft: '4px',
              marginRight: '8px',
              color: 'attention.fg',
            }}
          >
            {'Unassigned'}
          </Text>
        )}
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
        <ReviewStatus pr={pr} />
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
