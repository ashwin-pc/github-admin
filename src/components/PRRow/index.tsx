import { PullRequest } from '@octokit/graphql-schema';
import { Box } from '@primer/react';
import './index.css';
import { Stats } from './Stats';
import { TimelineSection } from './Timeline';
import { Info } from './Info';

interface PRRowProps {
  pr: PullRequest;
}

export const PRRow = ({ pr }: PRRowProps) => {
  return (
    <Box
      className={`row`}
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
      <Info pr={pr} />
      <TimelineSection pr={pr} />
      <Stats pr={pr} />
    </Box>
  );
};
