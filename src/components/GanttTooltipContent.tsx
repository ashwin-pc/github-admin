import React from 'react';
import { Task as GanttTask } from 'gantt-task-react';
import { Box, Text, Heading, UnorderedList, ListItem } from '@primer/react';

// Our internal Task (from utils/gantt_utils) might have phaseActivities
interface ExtendedGanttTask extends GanttTask {
  phaseActivities?: string[];
}

interface GanttTooltipContentProps {
  task: ExtendedGanttTask; // Use the extended task type
  fontSize: string;
  fontFamily: string;
}

export const GanttTooltipContent: React.FC<GanttTooltipContentProps> = ({
  task,
  fontSize,
  fontFamily,
}) => {
  return (
    <Box
      sx={{
        padding: '10px',
        fontFamily: fontFamily,
        fontSize: fontSize,
        color: 'fg.default', // Use Primer theme color
        minWidth: '250px', // Ensure tooltip has some width
        maxWidth: '400px', // Prevent tooltip from becoming too wide
      }}
    >
      <Heading as="h3" sx={{ fontSize: '1.1em', marginBottom: '8px', borderBottom: '1px solid', borderColor: 'border.default', paddingBottom: '4px' }}>
        {task.name}
      </Heading>
      {task.phaseActivities && task.phaseActivities.length > 0 ? (
        <UnorderedList sx={{ paddingLeft: '20px', margin: 0, listStyleType: 'disc' }}>
          {task.phaseActivities.map((activity, index) => (
            <ListItem key={index} sx={{ fontSize: '0.95em', marginBottom: '4px', color: 'fg.muted' }}>
              {activity}
            </ListItem>
          ))}
        </UnorderedList>
      ) : (
        <Text sx={{ fontSize: '0.95em', color: 'fg.subtle' }}>
          No specific activities recorded for this phase.
        </Text>
      )}
      <Box sx={{marginTop: '8px', paddingTop: '4px', borderTop: '1px solid', borderColor: 'border.default'}}>
        <Text sx={{fontSize: '0.8em', color: 'fg.subtle'}}>
            Start: {task.start.toLocaleDateString()} {task.start.toLocaleTimeString()}
        </Text><br/>
        <Text sx={{fontSize: '0.8em', color: 'fg.subtle'}}>
            End: {task.end.toLocaleDateString()} {task.end.toLocaleTimeString()}
        </Text>
      </Box>
    </Box>
  );
};
