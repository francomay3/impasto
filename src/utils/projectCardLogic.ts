export function formatProjectDate(updatedAt: string): string {
  return new Date(updatedAt).toLocaleDateString();
}

export function getProjectRoute(id: string): string {
  return `/project/${id}`;
}
