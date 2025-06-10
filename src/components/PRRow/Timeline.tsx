import "gantt-task-react/dist/index.css";
import "gantt-task-react/dist/index.css";
import { PullRequest } from '@octokit/graphql-schema';
import { HistoryIcon, CommentIcon } from '@primer/octicons-react';
import { Box, Token, Spinner } from '@primer/react';
import { Tooltip } from '../Tooltip';
import { PRGanttChart } from '../PRGanttChart'; // Import the new Gantt Chart component
import { getTimelineEvents } from '../../utils/get_timeline_events'; // This will be used for totalEvents count for now

export const TimelineSection = ({ pr }: { pr: PullRequest }) => {
  // We still need totalEvents for the summary display.
  // In a future step, this could be derived differently or from the Gantt tasks if appropriate.
  const { totalEvents } = getTimelineEvents(pr);


  if (!pr.comments) { // Keep this check if PR data might be incomplete
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
      >
        <Spinner size="small" /> Loading timeline data...
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%', backgroundColor: 'canvas.default' }}>
      <PRGanttChart pr={pr} />
      <Box
        sx={{
          position: 'absolute',
          right: '10px', // Adjusted for better spacing
          bottom: '10px', // Adjusted for better spacing
          backgroundColor: 'canvas.overlay', // Use overlay for better visibility over chart
          padding: '5px',
          borderRadius: '6px',
          boxShadow: 'medium', // Add a subtle shadow
          display: 'flex',
          gap: '10px', // Increased gap
          zIndex: 10, // Ensure it's above the Gantt chart
        }}
      >
        {pr.comments?.totalCount > 0 && (
          <Tooltip
            aria-label={`${pr.comments.totalCount} comments`}
            direction="w"
          >
            <Token
              text={pr.comments.totalCount.toString()} // Ensure text is string
              leadingVisual={CommentIcon}
              as="span"
              sx={{ fontSize: 'small' }} // Consistent sizing
            />
          </Tooltip>
        )}
        {totalEvents > 0 && (
          <Tooltip aria-label={`${totalEvents} events in total`} direction="w">
            <Token
              text={totalEvents.toString()} // Ensure text is string
              leadingVisual={HistoryIcon}
              as="span"
              sx={{ fontSize: 'small' }} // Consistent sizing
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};
