import { Menu, Avatar, Text, Group } from '@mantine/core';
import { LogOut, Settings, CreditCard, Bell, FlaskConical } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function UserMenu() {
  const { user } = useAuth();

  return (
    <Menu position="bottom-end" offset={8} withArrow>
      <Menu.Target>
        <Group gap="xs" style={{ cursor: 'pointer' }}>
          <Text size="sm">{user?.displayName ?? user?.email}</Text>
          <Avatar src={user?.photoURL ?? undefined} radius="xl" size={36} />
        </Group>
      </Menu.Target>

      <Menu.Dropdown>
        {user && (
          <>
            <Menu.Label>
              <Text size="xs" c="dimmed">{user.displayName ?? user.email}</Text>
            </Menu.Label>
            <Menu.Divider />
          </>
        )}
        <Menu.Item leftSection={<Settings size={14} />} disabled>Settings</Menu.Item>
        <Menu.Item leftSection={<CreditCard size={14} />} disabled>Billing</Menu.Item>
        <Menu.Item leftSection={<Bell size={14} />} disabled>Notifications</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<FlaskConical size={14} />} disabled>My Pigments</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<LogOut size={14} />} color="red" onClick={() => signOut(auth)}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
