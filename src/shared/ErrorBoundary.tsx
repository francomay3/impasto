import { Component, type ReactNode } from 'react';
import { Alert, Button, Center, Stack, Text, Title } from '@mantine/core';
import { TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  label?: string;
  compact?: boolean;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { label = 'This section', compact } = this.props;

    if (compact) {
      return (
        <Center h="100%" style={{ flex: 1 }}>
          <Stack align="center" gap="xs" p="lg">
            <TriangleAlert size={20} color="var(--mantine-color-red-5)" />
            <Text size="sm" c="dimmed" ta="center">{label} failed to render</Text>
            <Button size="xs" variant="subtle" color="red" onClick={this.reset}>Retry</Button>
          </Stack>
        </Center>
      );
    }

    return (
      <Center h="100vh">
        <Stack align="center" gap="md" maw={480} p="xl">
          <Alert
            icon={<TriangleAlert size={20} />}
            color="red"
            variant="light"
            w="100%"
            title="Something went wrong"
          >
            <Text size="sm" c="dimmed" mt={4}>{error.message}</Text>
          </Alert>
          <Title order={4} c="dimmed">An unexpected error occurred</Title>
          <Button variant="light" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </Stack>
      </Center>
    );
  }
}
