import {Box, Text, useInput} from 'ink';

export function HelpOverlay({onClose}: {onClose: () => void}) {
  useInput((input, key) => {
    if (key.escape || input === '?') onClose();
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>tuitask help</Text>
      <Text bold>Main list</Text>
      <Text>Up/k Previous task Down/j Next task</Text>
      <Text>a Add e Edit Space Complete or reopen</Text>
      <Text>d Delete f Cycle Active, Completed, All</Text>
      <Text>? Help q Quit</Text>
      <Text bold>Forms</Text>
      <Text>Tab/Shift+Tab Move Enter Select Esc Cancel</Text>
      <Text>Priority: arrows or Space Description: Enter adds a line</Text>
      <Text>Yellow DUE TODAY Red OVERDUE</Text>
      <Text bold>Delete</Text>
      <Text>y Confirm n/Esc Cancel Tab Choose Enter Select</Text>
      <Text dimColor>Press ? or Esc to close help.</Text>
    </Box>
  );
}
