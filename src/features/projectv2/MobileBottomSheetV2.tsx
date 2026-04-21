import { useState } from 'react';
import { Drawer } from 'vaul';
import { Box, Divider, Stack, Text, VisuallyHidden } from '@mantine/core';
import { MobileColorCardV2 } from './MobileColorCardV2';
import { useImpastoColorPins } from '../../engine/colorPins/useImpastoColorPins';

// Exported so the parent layout can reserve matching space below the viewport area.
export const PEEK_PX = 100;
const EXPANDED_PX = 500;

interface MobileBottomSheetV2Props {
  /** When true, the portaled sheet still mounts but ignores pointer events (structural hydration). */
  interactionBlocked?: boolean;
}

export function MobileBottomSheetV2({ interactionBlocked = false }: MobileBottomSheetV2Props) {
  const [snap, setSnap] = useState<number | string | null>(`${PEEK_PX}px`);
  const pins = useImpastoColorPins();
  const isExpanded = snap === `${EXPANDED_PX}px`;

  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      snapPoints={[`${PEEK_PX}px`, `${EXPANDED_PX}px`]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <Drawer.Portal>
        <Drawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            // Must match window.innerHeight so vaul's translateY math is correct.
            // Vaul computes offset = windowHeight - snapPx, so the drawer height
            // must equal windowHeight for the visible portion to equal snapPx.
            height: '100dvh',
            background: 'var(--mantine-color-dark-8)',
            borderTop: '1px solid var(--mantine-color-dark-6)',
            borderRadius: '16px 16px 0 0',
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            pointerEvents: interactionBlocked ? 'none' : 'auto',
          }}
        >
          {/* Required by Radix Dialog (which vaul wraps) for screen reader accessibility */}
          <Drawer.Title asChild>
            <VisuallyHidden>Color palette panel</VisuallyHidden>
          </Drawer.Title>

          {/* Visual drag handle pill */}
          <Box
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 10,
              paddingBottom: 6,
              flexShrink: 0,
            }}
          >
            <Box
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: 'var(--mantine-color-dark-4)',
              }}
            />
          </Box>

          {/* data-vaul-no-drag prevents scroll area from conflicting with vaul's drag detection */}
          <Box
            data-vaul-no-drag
            style={{ flex: 1, overflowY: isExpanded ? 'auto' : 'hidden', padding: '0 12px 16px' }}
          >
            <Text size="xs" c="dimmed" fw={500} mb={8}>
              Colors
            </Text>
            <Stack gap={6}>
              {pins.map((pin) => (
                <MobileColorCardV2 key={pin.id} hex={pin.color} name="" />
              ))}
            </Stack>
            {isExpanded && (
              <>
                <Divider my={12} />
                <Text size="xs" c="dimmed" fw={500}>
                  Pigments
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Pigment selector coming soon
                </Text>
              </>
            )}
          </Box>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
