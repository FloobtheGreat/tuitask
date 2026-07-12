import {Text} from 'ink';
import type {TaskFilter} from '../domain/task.js';

export function FilterBar({filter}: {filter: TaskFilter}) {
  return (
    <Text>
      {(['active', 'completed', 'all'] as const).map((item, index) => (
        <Text key={item} bold={item === filter} inverse={item === filter}>
          {index === 0 ? '' : ' | '} {item[0]?.toUpperCase()}
          {item.slice(1)}{' '}
        </Text>
      ))}
    </Text>
  );
}
