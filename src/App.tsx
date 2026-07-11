import {Box, Text, useApp, useInput} from 'ink';

export function App() {
  const {exit} = useApp();

  useInput((input) => {
    if (input === 'q') {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        tuitask
      </Text>
      <Text>No tasks yet.</Text>
      <Text dimColor>Press q to quit.</Text>
    </Box>
  );
}
