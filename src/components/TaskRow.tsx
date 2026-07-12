import {Text} from 'ink';
import {isOverdue} from '../domain/sorting.js';
import type {Task} from '../domain/task.js';

const PRIORITY = {1: 'L', 2: 'M', 3: 'H'} as const;

type Props = {task: Task; selected: boolean; now: Date; maxTitleLength: number};

export function TaskRow({task, selected, now, maxTitleLength}: Props) {
  const status = task.completedAt === null ? ' ' : 'x';
  const overdue = isOverdue(task, now) ? ' OVERDUE' : '';
  const priority =
    task.priority === null ? '' : ` P:${PRIORITY[task.priority]}`;
  const due = task.dueDate === null ? '' : ` ${task.dueDate}`;
  const title =
    task.title.length > maxTitleLength
      ? `${task.title.slice(0, Math.max(1, maxTitleLength - 3))}...`
      : task.title;

  return (
    <Text inverse={selected} {...(isOverdue(task, now) ? {color: 'red'} : {})}>
      {selected ? '>' : ' '} [{status}] {title}
      {overdue}
      {priority}
      {due}
    </Text>
  );
}
