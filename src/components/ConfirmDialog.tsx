import {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import type {Task} from '../domain/task.js';

type Props = {
  task: Task;
  onConfirm: () => string | null;
  onCancel: () => void;
};

export function ConfirmDialog({task, onConfirm, onCancel}: Props) {
  const [confirmSelected, setConfirmSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    const message = onConfirm();
    if (message !== null) setError(message);
  };

  useInput((input, key) => {
    if (key.escape || input.toLowerCase() === 'n') return onCancel();
    if (input.toLowerCase() === 'y') return confirm();
    if (key.tab || key.leftArrow || key.rightArrow) {
      return setConfirmSelected((selected) => !selected);
    }
    if (key.return) {
      if (confirmSelected) return confirm();
      return onCancel();
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>Delete task?</Text>
      <Text>This permanently deletes “{task.title}”.</Text>
      <Text>
        <Text inverse={!confirmSelected}>&gt; Cancel</Text>
        {'  '}
        <Text inverse={confirmSelected}>Delete</Text>
      </Text>
      {error !== null && <Text color="red">{error}</Text>}
      <Text dimColor>y Confirm n/Esc Cancel Tab Choose Enter Select</Text>
    </Box>
  );
}
