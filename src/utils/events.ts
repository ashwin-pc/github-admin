import mitt from 'mitt';

type Events = {
  'avatar:click': {
    login: string;
    type: 'author' | 'assignee' | 'reviewed-by';
  };
  'label:click': { label: string; negated?: boolean };
};

export const emitter = mitt<Events>();
