import { ActionList, ActionMenu } from '@primer/react';
import { useAppContext } from 'src/context';

export const Filters = ({
  onFilter,
}: {
  onFilter: (key: string, value: string) => void;
}) => {
  const { viewer } = useAppContext();
  return (
    <ActionMenu>
      <ActionMenu.Button>Filters</ActionMenu.Button>
      <ActionMenu.Overlay width="large">
        <ActionList>
          <ActionList.Item
            onClick={() => onFilter('author', viewer?.login || '')}
          >
            Your Pull Requests
          </ActionList.Item>
          <ActionList.Item
            onClick={() => onFilter('assignee', viewer?.login || '')}
          >
            Everything assigned to you
          </ActionList.Item>
          <ActionList.Item onClick={() => onFilter('sort', 'created-asc')}>
            Sort by oldest
          </ActionList.Item>
          <ActionList.Item onClick={() => onFilter('-is', 'draft')}>
            Skip drafts
          </ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
};
