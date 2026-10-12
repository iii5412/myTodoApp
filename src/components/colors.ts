import type { TodoColor } from '../lib/todos';

export const COLOR_VAR: Record<TodoColor, string> = {
  red: 'var(--color-tag-red)',
  orange: 'var(--color-tag-orange)',
  yellow: 'var(--color-tag-yellow)',
  green: 'var(--color-tag-green)',
  blue: 'var(--color-tag-blue)',
  purple: 'var(--color-tag-purple)',
};

export const COLOR_LABEL: Record<TodoColor, string> = {
  red: '빨강',
  orange: '주황',
  yellow: '노랑',
  green: '초록',
  blue: '파랑',
  purple: '보라',
};
