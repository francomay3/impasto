import { useEffect, useState } from 'react';
import { Container, Title, Table, Text, Loader, Center, Alert } from '@mantine/core';
import { listAllUsers, type UserProfile } from './adminService';

export function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllUsers()
      .then(setUsers)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container pt="xl">
      <Title order={2} mb="lg">Admin — Users</Title>
      {loading && (
        <Center>
          <Loader />
        </Center>
      )}
      {error && <Alert color="red">{error}</Alert>}
      {!loading && !error && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Display Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>UID</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.uid}>
                <Table.Td>{u.displayName ?? <Text c="dimmed" fs="italic">—</Text>}</Table.Td>
                <Table.Td>{u.email ?? <Text c="dimmed" fs="italic">—</Text>}</Table.Td>
                <Table.Td><Text ff="monospace" size="xs">{u.uid}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
}
