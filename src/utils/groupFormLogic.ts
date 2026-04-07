interface GroupResolution {
  finalGroupId: string | null;
  newGroup: { id: string; name: string } | null;
}

export function resolveGroupOnSave(
  creatingGroup: boolean,
  groupId: string | null,
  newGroupName: string
): GroupResolution {
  if (!creatingGroup) return { finalGroupId: groupId, newGroup: null };
  const name = newGroupName.trim();
  if (!name) return { finalGroupId: null, newGroup: null };
  const id = crypto.randomUUID();
  return { finalGroupId: id, newGroup: { id, name } };
}
