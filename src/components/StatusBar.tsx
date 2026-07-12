import {Text} from 'ink';

export function StatusBar({
  count,
  error,
  message,
  messageIsError,
}: {
  count: number;
  error: string | null;
  message: string | null;
  messageIsError: boolean;
}) {
  if (error !== null) return <Text color="red">Error: {error}</Text>;
  if (message !== null) {
    return <Text color={messageIsError ? 'red' : 'green'}>{message}</Text>;
  }
  return (
    <Text dimColor>
      {count} task(s) ↑/↓ Move a Add e Edit Space Complete d Delete f Filter c
      Copy p Projects ? Help q Quit
    </Text>
  );
}
