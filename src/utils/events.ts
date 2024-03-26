import mitt from 'mitt';

type Events = {
  'avatar:click': { login: string; type: 'author' | 'assignee' };
  'label:click': { label: string; negated?: boolean };
};

export const emitter = mitt<Events>();
