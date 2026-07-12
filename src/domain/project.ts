export const INBOX_PROJECT_ID = 1;

export type Project = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {name: string};
export type UpdateProjectInput = CreateProjectInput;

export interface ProjectRepository {
  listProjects(): Project[];
  createProject(input: CreateProjectInput): Project;
  updateProject(id: number, input: UpdateProjectInput): Project;
  deleteProject(id: number): boolean;
}

export type ProjectTaskGroup<T> = {project: Project; tasks: readonly T[]};

export function sortProjects(projects: readonly Project[]): Project[] {
  return [...projects].sort((left, right) => {
    if (left.id === right.id) return 0;
    if (left.id === INBOX_PROJECT_ID) return -1;
    if (right.id === INBOX_PROJECT_ID) return 1;
    return left.name.localeCompare(right.name, undefined, {
      sensitivity: 'base',
    });
  });
}
