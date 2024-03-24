import { PullRequest } from '@octokit/graphql-schema';
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
import { Stats } from './Stats';
import { ReviewStatus } from './ReviewStatus';
import { getUniqueValues } from '../../utils/common';
import { TimelineSection } from './Timeline';

interface PRRowProps {
  pr: PullRequest;
  selectedPR?: PullRequest;
  setSelectedPR: React.Dispatch<React.SetStateAction<PullRequest | undefined>>;
}

export const PRRow = ({ pr, selectedPR, setSelectedPR }: PRRowProps) => {
  return (
    <Box
      className={`row ${selectedPR?.id === pr.id ? 'selected' : ''}`}
      onClick={() =>
        setSelectedPR((currentPr) => (currentPr === pr ? undefined : pr))
      }
      sx={{
        border: '1px solid',
        borderColor: 'border.subtle',
        backgroundColor: 'canvas.inset',
        fontSize: '.9rem',
        '&:hover': {
          backgroundColor: 'canvas.subtle',
        },
      }}
    >
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
          />
          <Text
            as="span"
            sx={{
              marginLeft: '8px',
            }}
          >
            {pr.author?.login}
          </Text>
          {(pr?.assignees?.nodes?.length || 0) > 0 ? (
            <Tooltip
              aria-label={getUniqueValues(
                (pr.assignees?.nodes || []).map((assignee) => assignee?.login),
              ).join(', ')}
              direction="w"
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
                {' |  '}
                Assigned:{' '}
              </Text>
              <AvatarStack>
                {getUniqueValues(
                  (pr.assignees?.nodes || []).map(
                    (assignee) => assignee?.avatarUrl,
                  ),
                ).map((url) => (
                  <Avatar src={url} size={15} key={url} />
                ))}
              </AvatarStack>
            </Tooltip>
          ) : (
            <Text
              as="span"
              sx={{
                marginLeft: '4px',
                marginRight: '8px',
              }}
            >
              {' |  Unassigned'}
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
            >
              {label?.name}
            </Label>
          ))}
        </LabelGroup>
      </Box>
      <TimelineSection pr={pr} />
      <Stats pr={pr} />
    </Box>
  );
};
