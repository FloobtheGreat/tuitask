import {useEffect, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {
  INBOX_PROJECT_ID,
  sortProjects,
  type Project,
} from '../domain/project.js';

type Mode = 'browse' | 'create' | 'rename' | 'confirm-delete';

type Props = {
  projects: readonly Project[];
  onCreate: (name: string) => string | null;
  onRename: (id: number, name: string) => string | null;
  onDelete: (id: number) => string | null;
  onClose: () => void;
};

export function ProjectManager({
  projects,
  onCreate,
  onRename,
  onDelete,
  onClose,
}: Props) {
  const ordered = sortProjects(projects);
  const [selectedId, setSelectedId] = useState(
    ordered[0]?.id ?? INBOX_PROJECT_ID,
  );
  const [mode, setMode] = useState<Mode>('browse');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selectedIndex = Math.max(
    0,
    ordered.findIndex(({id}) => id === selectedId),
  );
  const selected = ordered[selectedIndex] ?? null;

  useEffect(() => {
    if (!ordered.some(({id}) => id === selectedId)) {
      setSelectedId(
        ordered[Math.min(selectedIndex, ordered.length - 1)]?.id ??
          INBOX_PROJECT_ID,
      );
    }
  }, [ordered, selectedId, selectedIndex]);

  useInput((input, key) => {
    if (mode === 'confirm-delete') {
      if (key.escape || input === 'n') return setMode('browse');
      if (input === 'y' && selected !== null) {
        const result = onDelete(selected.id);
        setError(result);
        return setMode('browse');
      }
      return;
    }
    if (mode === 'create' || mode === 'rename') {
      if (key.escape) {
        setError(null);
        return setMode('browse');
      }
      if (key.return) {
        if (name.trim() === '') return setError('Project name is required');
        const result =
          mode === 'create'
            ? onCreate(name)
            : selected === null
              ? 'Select a project'
              : onRename(selected.id, name);
        if (result !== null) return setError(result);
        setError(null);
        setName('');
        return setMode('browse');
      }
      if (key.backspace || key.delete) {
        return setName((value) => value.slice(0, -1));
      }
      if (!key.ctrl && !key.meta && input !== '') {
        setName((value) => value + input);
      }
      return;
    }
    if (key.escape || input === 'p') return onClose();
    if (key.upArrow || input === 'k') {
      return setSelectedId(
        ordered[Math.max(0, selectedIndex - 1)]?.id ?? selectedId,
      );
    }
    if (key.downArrow || input === 'j') {
      return setSelectedId(
        ordered[Math.min(ordered.length - 1, selectedIndex + 1)]?.id ??
          selectedId,
      );
    }
    if (input === 'n') {
      setName('');
      setError(null);
      return setMode('create');
    }
    if (input === 'r' && selected !== null) {
      setName(selected.name);
      setError(null);
      return setMode('rename');
    }
    if (input === 'd' && selected !== null) {
      setError(null);
      return setMode('confirm-delete');
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>Projects</Text>
      {ordered.map((project) => (
        <Text key={project.id} inverse={project.id === selectedId}>
          {project.id === selectedId ? '>' : ' '} {project.name}
          {project.id === INBOX_PROJECT_ID ? ' (protected)' : ''}
        </Text>
      ))}
      {(mode === 'create' || mode === 'rename') && (
        <Text inverse>
          {mode === 'create' ? 'New project' : 'Rename project'}: {name}
        </Text>
      )}
      {mode === 'confirm-delete' && selected !== null && (
        <Text color="yellow">
          Delete {selected.name}? y Confirm n/Esc Cancel
        </Text>
      )}
      {error !== null && <Text color="red">Error: {error}</Text>}
      <Text dimColor>
        {mode === 'browse'
          ? '↑/↓ Move n New r Rename d Delete p/Esc Close'
          : mode === 'confirm-delete'
            ? 'y Confirm n/Esc Cancel'
            : 'Enter Save Esc Cancel'}
      </Text>
    </Box>
  );
}
