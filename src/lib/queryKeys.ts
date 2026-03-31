export const queryKeys = {
  projects: (userId: string) => ['projects', userId] as const,
  project: (userId: string, projectId: string) => ['projects', userId, projectId] as const,
  exportSettings: (userId: string) => ['exportSettings', userId] as const,
};
