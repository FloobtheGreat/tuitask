import {Text} from 'ink';

export function StatusBar({
  count,
  error,
}: {
  count: number;
  error: string | null;
}) {
  if (error !== null) return <Text color="red">Error: {error}</Text>;
  return (
    <Text dimColor>
      {count} task(s) ↑/↓ Move a Add e Edit Space Complete d Delete f Filter q
      Quit
    </Text>
  );
}
