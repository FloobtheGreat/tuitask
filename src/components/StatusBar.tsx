import {Text} from 'ink';

export function StatusBar({
  count,
  error,
}: {
  count: number;
  error: string | null;
}) {
  if (error !== null) return <Text color="red">Error: {error}</Text>;
  return <Text dimColor>{count} task(s) ↑/↓ or j/k Move f Filter q Quit</Text>;
}
