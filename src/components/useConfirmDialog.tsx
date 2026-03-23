import { type JSX, useCallback } from 'react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

type Props = {
  title: string;
  description: string;
  onConfirm: () => void;
};

type ConfirmDialogReturn = {
  confirmDialog: JSX.Element;
  confirm: () => void;
};

type UseConfirmDialog = (props: Props) => ConfirmDialogReturn;

const useConfirmDialog: UseConfirmDialog = ({ title, description, onConfirm }) => {
  const [opened, { open, close }] = useDisclosure(false);

  const handleConfirm = useCallback(() => {
    onConfirm();
    close();
  }, [onConfirm, close]);

  const confirmDialog = (
    <Modal opened={opened} onClose={close} title={title} size="sm">
      <Text size="sm" c="dimmed" mb="lg">
        {description}
      </Text>
      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={close}>
          Cancel
        </Button>
        <Button color="red" onClick={handleConfirm}>
          Confirm
        </Button>
      </Group>
    </Modal>
  );

  return { confirm: open, confirmDialog };
};

export default useConfirmDialog;
