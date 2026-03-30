import type { MutableRefObject } from 'react';
import { Select, TextInput } from '@mantine/core';
import type { ComboboxItem } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import type { ColorGroup } from '../../types';

const NEW_GROUP = '__new__';

interface Props {
  groups: ColorGroup[];
  groupId: string | null;
  creatingGroup: boolean;
  newGroupName: string;
  selectOpenRef: MutableRefObject<boolean>;
  onGroupChange: (val: string | null) => void;
  onNewGroupNameChange: (name: string) => void;
  onBack: () => void;
  onSave: () => void;
}

export function PinEditGroupSection({
  groups,
  groupId,
  creatingGroup,
  newGroupName,
  selectOpenRef,
  onGroupChange,
  onNewGroupNameChange,
  onBack,
  onSave,
}: Props) {
  const selectData: ComboboxItem[] = [
    ...groups.map((g) => ({ value: g.id, label: g.name })),
    { value: NEW_GROUP, label: '+ New group' },
  ];

  if (!creatingGroup) {
    return (
      <Select
        label="Group"
        size="xs"
        data={selectData}
        value={groupId}
        onChange={onGroupChange}
        clearable
        placeholder="No group"
        comboboxProps={{ withinPortal: true, zIndex: 401 }}
        onDropdownOpen={() => { selectOpenRef.current = true; }}
        onDropdownClose={() => { selectOpenRef.current = false; }}
      />
    );
  }

  return (
    <TextInput
      label="New group name"
      size="xs"
      placeholder="Group name"
      value={newGroupName}
      onChange={(e) => onNewGroupNameChange(e.currentTarget.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSave(); }}
      leftSection={
        <ArrowLeft
          size={12}
          data-testid="new-group-back"
          style={{ cursor: 'pointer' }}
          onClick={onBack}
        />
      }
      autoFocus
    />
  );
}
