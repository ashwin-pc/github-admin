import React, { useMemo } from 'react';
import { Gantt, Task as GanttTaskType, ViewMode } from 'gantt-task-react'; // Renamed Task to GanttTaskType to avoid conflict
import { generateGanttTasksFromPR, Task as ProjectTask } from '../utils/gantt_utils';
import { PullRequest } from '@octokit/graphql-schema';
import { Box } from '@primer/react';
import { GanttTooltipContent } from './GanttTooltipContent'; // Import the new TooltipContent component

// Props for the PRGanttChart component
interface PRGanttChartProps {
  pr: PullRequest;
}

// Our ProjectTask includes phaseActivities, GanttTaskType from gantt-task-react does not by default.
// We rely on gantt-task-react to pass through extra properties.
// For type safety in mapProjectTasksToGanttTasks and for TooltipContent, we can use our ProjectTask structure
// as it's a superset of what Gantt expects for basic rendering, and includes our custom data.
// The Gantt component itself will receive tasks: (ProjectTask & {isDisabled: boolean})[] essentially.

const mapProjectTasksToGanttTasks = (projectTasks: ProjectTask[]): (GanttTaskType & { phaseActivities?: string[] })[] => {
  return projectTasks.map(task => ({
    ...task, // This will include id, name, type, start, end, progress, styles, and our phaseActivities
    isDisabled: false, // Common field often expected by gantt libraries
  }));
};

export const PRGanttChart: React.FC<PRGanttChartProps> = ({ pr }) => {
  // Generate tasks for the Gantt chart using useMemo to avoid regeneration on every render
  const ganttTasks = useMemo(() => {
    const projectTasks = generateGanttTasksFromPR(pr);
    return mapProjectTasksToGanttTasks(projectTasks);
  }, [pr]);

  // Basic error handling or empty state
  if (!ganttTasks || ganttTasks.length === 0) {
    return (
      <Box sx={{ padding: 2, textAlign: 'center', color: 'fg.muted' }}>
        No timeline data available to display Gantt chart.
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: 'sans-serif', marginY: 3, ".gantt-container": {cursor: "pointer"} }}> {/* Added cursor pointer to gantt-container for better UX */}
      <Gantt
        tasks={ganttTasks}
        viewMode={ViewMode.Day}
        // Optional handlers (can be implemented later)
        // onDateChange={(task, start, end) => console.log('Date Change:', task, start, end)}
        // onProgressChange={(task, progress) => console.log('Progress Change:', task, progress)}
        // onClick={task => console.log('Task Click:', task)}
        TooltipContent={GanttTooltipContent} // Use the custom tooltip content component
        // Styling options
        rowHeight={40}
        listCellWidth={"180px"}
        ganttHeight={300}
        // columnWidth={65} // Example: slightly wider columns if needed
      />
    </Box>
  );
};
