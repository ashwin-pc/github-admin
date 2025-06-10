import { PullRequest, IssueComment, ReviewRequestedEvent, PullRequestReview, MergedEvent, ClosedEvent, Actor } from '@octokit/graphql-schema';

// Define the Task interface for Gantt chart
export interface Task {
  id: string;
  name: string;
  type: 'task' | 'milestone' | 'project';
  start: Date;
  end: Date;
  progress: number; // Percentage (0-100)
  styles?: {
    backgroundColor?: string;
    progressColor?: string;
    textColor?: string;
  };
  dependencies?: string[]; // IDs of tasks this task depends on
  phaseActivities?: string[]; // New property for detailed activity messages
}

// Define a type for processed timeline events
// This includes relevant timeline items and a synthetic event for PR opening.
type ProcessedEvent = (
  | IssueComment
  | ReviewRequestedEvent
  | PullRequestReview
  | MergedEvent
  | ClosedEvent
  | { __typename: 'PullRequestOpened'; createdAt: string; actor?: Actor | null } // Synthetic event
) & { date: Date; actor?: Actor | null }; // Common properties: date and actor


// Function to generate Gantt tasks from Pull Request data
export const generateGanttTasksFromPR = (pr: PullRequest): Task[] => {
  const tasks: Task[] = [];
  const processedEvents: ProcessedEvent[] = [];

  // Collect and process relevant events from PR timeline
  if (pr.timelineItems && pr.timelineItems.nodes) {
    pr.timelineItems.nodes.forEach(node => {
      if (!node) return; // Skip null nodes

      let eventDateStr: string | undefined;
      let eventActor: Actor | null | undefined = undefined; // Explicitly undefined

      switch (node.__typename) {
        case 'IssueComment':
          eventDateStr = node.createdAt;
          eventActor = node.author;
          break;
        case 'ReviewRequestedEvent':
          eventDateStr = node.createdAt;
          eventActor = node.actor;
          break;
        case 'PullRequestReview':
          eventDateStr = node.submittedAt;
          eventActor = node.author;
          break;
        case 'MergedEvent':
          eventDateStr = node.createdAt;
          eventActor = node.actor;
          break;
        case 'ClosedEvent':
          eventDateStr = node.createdAt;
          eventActor = node.actor;
          break;
        default:
          return; // Skip unknown or irrelevant timeline items
      }

      if (eventDateStr) {
        processedEvents.push({
          ...node,
          date: new Date(eventDateStr),
          actor: eventActor || null, // Ensure actor is null if undefined
        } as ProcessedEvent);
      }
    });
  }

  // Add the PR creation event as the very first event
  processedEvents.push({
    __typename: 'PullRequestOpened',
    createdAt: pr.createdAt,
    actor: pr.author || null,
    date: new Date(pr.createdAt),
  } as ProcessedEvent);

  // Sort all events chronologically
  processedEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (processedEvents.length === 0) {
    return tasks; // Should not happen as 'PullRequestOpened' is always added
  }

  // Initial "PR Opened" task. Its end date will be the start of the first actual event,
  // or merge/close date, or now if still open and no other events.
  const prOpenedEvent = processedEvents[0]; // This is always the PullRequestOpened event
  let openedTaskEnd: Date;
  if (processedEvents.length > 1) {
    openedTaskEnd = processedEvents[1].date; // Ends when the next chronological event starts
  } else if (pr.mergedAt) {
    openedTaskEnd = new Date(pr.mergedAt);
  } else if (pr.closedAt) {
    openedTaskEnd = new Date(pr.closedAt);
  } else {
    openedTaskEnd = new Date(); // Still open, no other events
  }

  tasks.push({
    id: `${pr.id}-opened`,
    name: 'PR Opened',
    type: 'task',
    start: prOpenedEvent.date,
    end: openedTaskEnd,
    progress: 100,
    styles: { backgroundColor: '#BDDFFF', progressColor: '#64B5F6', textColor: '#1A237E' }, // Light Blue
  });


  // Iterate through sorted events to create subsequent tasks
  for (let i = 0; i < processedEvents.length; i++) {
    const event = processedEvents[i];
    const nextEvent = processedEvents[i + 1];

    let phaseName = '';
    let taskStyles: Task['styles'] = {};
    let isMilestone = false;
    let taskSpecificIdPart = event.__typename.toLowerCase();
    const phaseActivities: string[] = []; // Initialize for each potential task

    // Helper to format activity string
    const formatActivity = (e: ProcessedEvent, activityText: string): string => {
      const dateStr = e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = e.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const author = e.actor?.login || 'System';
      return `[${dateStr} ${timeStr}] ${author}: ${activityText}`;
    };

    let currentEventActivityText = ""; // Specific text for the event defining the phase start

    switch (event.__typename) {
      case 'PullRequestOpened':
        // PR Opened task is handled before this loop.
        // Collect its activity for the initial task.
        const openedActivityText = `PR Opened by ${pr.author?.login || 'Unknown'}`;
        if (tasks.length > 0 && tasks[0].id.endsWith('-opened')) {
            tasks[0].phaseActivities = tasks[0].phaseActivities || [];
            tasks[0].phaseActivities.push(formatActivity(event, openedActivityText));
             // Adjust end time if a subsequent task starts sooner.
            if (nextEvent && tasks[0].end > nextEvent.date) {
                tasks[0].end = nextEvent.date;
            }
        }
        continue;

      case 'ReviewRequestedEvent':
        phaseName = 'Awaiting Review';
        currentEventActivityText = `Review requested from ${ (event as ReviewRequestedEvent).requestedReviewer && (event as ReviewRequestedEvent).requestedReviewer!.__typename === 'User' ? ((event as ReviewRequestedEvent).requestedReviewer as User).login : ((event as ReviewRequestedEvent).requestedReviewer as Team).name || 'N/A'}`;
        taskStyles = { backgroundColor: '#FFF9C4', progressColor: '#FFEE58', textColor: '#3E2723' };
        taskSpecificIdPart = `reviewrequested-${(event as ReviewRequestedEvent).id || i}`;
        break;

      case 'PullRequestReview':
        const review = event as PullRequestReview;
        taskSpecificIdPart = `review-${review.id}`;
        let reviewStateText = review.state.toLowerCase().replace(/_/g, ' ');
        if (review.body) {
            reviewStateText += ` - "${review.body.substring(0, 50)}${review.body.length > 50 ? '...' : ''}"`;
        }
        currentEventActivityText = `Review ${reviewStateText}`;
        if (review.state === 'CHANGES_REQUESTED') {
          phaseName = 'Changes Requested';
          taskStyles = { backgroundColor: '#FFCDD2', progressColor: '#E57373', textColor: '#B71C1C' };
        } else if (review.state === 'APPROVED') {
          phaseName = 'Approved';
          taskStyles = { backgroundColor: '#C8E6C9', progressColor: '#81C784', textColor: '#1B5E20' };
        } else if (review.state === 'COMMENTED') {
          phaseName = 'Review Comment';
          taskStyles = { backgroundColor: '#F5F5F5', progressColor: '#E0E0E0', textColor: '#424242' };
        } else {
          continue;
        }
        break;

      case 'IssueComment':
        const comment = event as IssueComment;
        taskSpecificIdPart = `comment-${comment.id}`;
        currentEventActivityText = `Commented - "${comment.bodyText.substring(0, 50)}${comment.bodyText.length > 50 ? '...' : ''}"`;
        const lastTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;
        if (lastTask && (lastTask.name === 'Changes Requested' || lastTask.name === 'Review Comment')) {
          phaseName = 'Addressing Feedback';
          taskStyles = { backgroundColor: '#FFECB3', progressColor: '#FFD54F', textColor: '#424242' };
        } else {
          phaseName = 'Discussion/Update';
          taskStyles = { backgroundColor: '#ECEFF1', progressColor: '#B0BEC5', textColor: '#263238' };
        }
        break;

      case 'MergedEvent':
        phaseName = 'Merged';
        currentEventActivityText = `PR Merged by ${event.actor?.login || 'Unknown'}`;
        taskStyles = { backgroundColor: '#D1C4E9', progressColor: '#9575CD', textColor: '#311B92' };
        isMilestone = true;
        taskSpecificIdPart = `merged-${(event as MergedEvent).id}`;
        break;

      case 'ClosedEvent':
        if (pr.merged) continue;
        phaseName = 'Closed (Not Merged)';
        currentEventActivityText = `PR Closed by ${event.actor?.login || 'Unknown'}`;
        taskStyles = { backgroundColor: '#CFD8DC', progressColor: '#90A4AE', textColor: '#263238' };
        isMilestone = true;
        taskSpecificIdPart = `closed-${(event as ClosedEvent).id}`;
        break;

      default:
        continue;
    }

    if (!phaseName) continue;

    // Add the activity that defines the start of this phase
    if(currentEventActivityText) phaseActivities.push(formatActivity(event, currentEventActivityText));


    let taskStart = event.date;
    let taskEnd: Date;

    if (isMilestone) {
      taskEnd = event.date;
    } else if (nextEvent) {
      taskEnd = nextEvent.date;
    } else {
      if (pr.mergedAt) taskEnd = new Date(pr.mergedAt);
      else if (pr.closedAt) taskEnd = new Date(pr.closedAt);
      else taskEnd = new Date();
    }

    if (taskEnd < taskStart && !isMilestone) {
      taskEnd = new Date(taskStart.getTime() + 60000);
    }
    if (isMilestone && taskEnd < taskStart) taskStart = taskEnd;
    if (isMilestone && taskStart < taskEnd) taskEnd = taskStart;

    // Collect activities from other subsequent events that fall within this phase's timeframe
    // This loop looks ahead from the current event (i) up to the next defining event or end of PR.
    if (!isMilestone && nextEvent) {
        for (let j = i + 1; j < processedEvents.length; j++) {
            const subEvent = processedEvents[j];
            if (subEvent.date >= taskEnd) break; // Stop if sub-event is at or after current phase's end

            let subActivityText = '';
            // We only want to log sub-activities if they are not phase-defining themselves,
            // or if they are minor events like comments within a larger phase.
            switch (subEvent.__typename) {
                case 'IssueComment':
                    subActivityText = `Commented - "${(subEvent as IssueComment).bodyText.substring(0,50)}${(subEvent as IssueComment).bodyText.length > 50 ? "..." : ""}"`;
                    break;
                case 'PullRequestReview':
                    // Only log 'COMMENTED' reviews as sub-activity. Approvals/Changes Requested define new phases.
                    if ((subEvent as PullRequestReview).state === 'COMMENTED') {
                        subActivityText = `Review Comment - "${(subEvent as PullRequestReview).body?.substring(0,50)}${(subEvent as PullRequestReview).body?.length > 50 ? "..." : ""}"`;
                    }
                    break;
                // Other event types like ReviewRequestedEvent, MergedEvent, ClosedEvent, Approved, Changes Requested
                // are typically phase-defining, so they won't be listed as sub-activities of the current phase.
            }
            if (subActivityText) {
                phaseActivities.push(formatActivity(subEvent, subActivityText));
            }
        }
    }


    if (tasks.length > 0) {
      const previousTask = tasks[tasks.length - 1];
      if (previousTask.type !== 'milestone' && previousTask.end > taskStart) {
        previousTask.end = taskStart;
      }
    }

    const latestTaskInList = tasks.length > 0 ? tasks[tasks.length - 1] : null;
    if (latestTaskInList && latestTaskInList.name === phaseName && latestTaskInList.type === (isMilestone ? 'milestone' : 'task') && !isMilestone) {
      if (latestTaskInList.end < taskEnd) {
          latestTaskInList.end = taskEnd;
      }
      // Append activities to existing phase if merged
      latestTaskInList.phaseActivities = (latestTaskInList.phaseActivities || []).concat(phaseActivities);
    } else {
      tasks.push({
        id: `${pr.id}-${taskSpecificIdPart}`,
        name: phaseName,
        type: isMilestone ? 'milestone' : 'task',
        start: taskStart,
        end: taskEnd,
        progress: 100,
        styles: taskStyles,
        phaseActivities: phaseActivities, // Add accumulated activities
      });
    }
  }

  // Final adjustments:
  // Correctly assign activities for the "PR Opened" task.
  // It should only contain the "PR Opened by..." message.
  // The current logic for "PullRequestOpened" case inside the loop might misplace this.
  // Let's ensure the first task (PR Opened) only has its defining activity.
  if (tasks.length > 0 && tasks[0].id.endsWith('-opened')) {
      const prOpenedEvent = processedEvents.find(e => e.__typename === 'PullRequestOpened');
      if (prOpenedEvent) {
          const openedActivityText = `PR Opened by ${pr.author?.login || 'Unknown'}`;
          // Ensure it's formatted correctly and is the only activity for "PR Opened" task
          tasks[0].phaseActivities = [formatActivity(prOpenedEvent, openedActivityText)];
      }
  }
   // Special handling for Merged/Closed milestones to ensure their activities are just their defining event.
   tasks.forEach(task => {
    if (task.name === 'Merged' || task.name === 'Closed (Not Merged)') {
        const definingEvent = processedEvents.find(e => e.date.getTime() === task.start.getTime() && (
            (e.__typename === 'MergedEvent' && task.name === 'Merged') ||
            (e.__typename === 'ClosedEvent' && task.name === 'Closed (Not Merged)')
        ));
        if (definingEvent) {
            let activityText = '';
            if (task.name === 'Merged') activityText = `PR Merged by ${definingEvent.actor?.login || 'Unknown'}`;
            else activityText = `PR Closed by ${definingEvent.actor?.login || 'Unknown'}`;
            task.phaseActivities = [formatActivity(definingEvent, activityText)];
        }
    }
   });


  // 1. Ensure the "PR Opened" task (if it's the only one) correctly reflects merge/close/current status.
  // 1. Ensure the "PR Opened" task (if it's the only one) correctly reflects merge/close/current status.
  if (tasks.length === 1 && tasks[0].id.endsWith('-opened')) {
    if (pr.mergedAt) tasks[0].end = new Date(pr.mergedAt);
    else if (pr.closedAt) tasks[0].end = new Date(pr.closedAt);
    else tasks[0].end = new Date(); // Still open
  }

  // 2. If PR is still open, ensure the last non-milestone task extends to the current time.
  if (pr.state === 'OPEN' && !pr.mergedAt && !pr.closedAt && tasks.length > 0) {
    let lastModifiableTask: Task | null = null;
    for (let i = tasks.length - 1; i >= 0; i--) {
      if (tasks[i].type !== 'milestone') {
        lastModifiableTask = tasks[i];
        break;
      }
    }
    if (lastModifiableTask && lastModifiableTask.end < new Date()) {
      // Only extend if its current calculated end is in the past.
      // This prevents overriding a legitimate future end date if one was set by a subsequent event.
      lastModifiableTask.end = new Date();
    }
  }

  // 3. Filter out tasks where start date is strictly after end date.
  //    Allow tasks where start and end are the same (milestones, or very short tasks).
  let finalTasks = tasks.filter(task => task.start <= task.end);

  // 4. Deduplication based on ID. This is a safeguard.
  //    A more robust approach would be to ensure IDs are truly unique during generation.
  const taskMap = new Map<string, Task>();
  finalTasks.forEach(task => {
    if (!taskMap.has(task.id) || (taskMap.has(task.id) && taskMap.get(task.id)!.end < task.end)) {
        // If task ID is new, or if this task has a later end date than existing one with same ID
        taskMap.set(task.id, task);
    }
  });
  finalTasks = Array.from(taskMap.values());

  // 5. Re-sort tasks by start date as some operations might have affected order.
  finalTasks.sort((a, b) => a.start.getTime() - b.start.getTime());

  // 6. Final check for "PR Opened" task: its end should not exceed the start of the next task.
  // Make sure there are at least two tasks and the first one is "PR Opened"
  if (finalTasks.length > 1 && finalTasks[0].id.endsWith('-opened')) {
      // Check if the second task starts before the first task ends
      if (finalTasks[0].end > finalTasks[1].start) {
          finalTasks[0].end = finalTasks[1].start;
      }
  }

  // Ensure phase activities are not duplicated if tasks were merged.
  finalTasks.forEach(task => {
    if (task.phaseActivities) {
        task.phaseActivities = Array.from(new Set(task.phaseActivities));
    }
  });

  return finalTasks;
};

// Helper types from @octokit/graphql-schema that might be needed for casting
type User = { __typename?: 'User', login: string };
type Team = { __typename?: 'Team', name: string };
