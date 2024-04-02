import { PullRequest } from '@octokit/graphql-schema';
import { Box } from '@primer/react';
import './index.css';
import { Stats } from './Stats';
import { TimelineSection } from './Timeline';
import { Info } from './Info';

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
      <Info pr={pr} />
      <TimelineSection pr={pr} />
      <Stats pr={pr} />
    </Box>
  );
};
