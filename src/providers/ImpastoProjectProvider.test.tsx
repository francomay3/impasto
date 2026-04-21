// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renameFirestoreProject } from '../services/FirestoreService';
import type { PersistenceStatus } from '../storage/PersistenceGlue';
import { ImpastoProjectProvider, useImpastoProject } from './ImpastoProjectProvider';

vi.mock('../firebase', () => ({
  db: {},
  storage: {},
}));

vi.mock('../storage/FirestoreStorageAdapter', () => ({
  FirestoreStorageAdapter: class FirestoreStorageAdapter {
    constructor() {}
  },
}));

const glueDispose = vi.fn();
const glueSubscribeStatus = vi.fn((cb: (s: PersistenceStatus) => void) => {
  cb('idle');
  return () => {};
});

/**
 * When `stallBeforeStructural` is true, `initialize` awaits until tests call `releasePastIdleObservation`
 * so `hydrationPhase === 'idle'` can be asserted after effects request hydrate (mirrors prod timing).
 */
const persistenceGlueMockCtl = vi.hoisted(() => ({
  stallBeforeStructural: false,
  releasePastIdleObservation: () => {},
}));

/** Mirrors real glue: `projectName` is readable after `initialize` resolves. */
vi.mock('../storage/PersistenceGlue', () => ({
  PersistenceGlue: class MockPersistenceGlue {
    private _projectName = '';

    constructor() {}

    get projectName(): string {
      return this._projectName;
    }

    async initialize(
      _projectId: string,
      _userId?: string,
      options?: { onStructuralReady?: () => void },
    ): Promise<void> {
      if (persistenceGlueMockCtl.stallBeforeStructural) {
        await new Promise<void>((resolve) => {
          persistenceGlueMockCtl.releasePastIdleObservation = () => resolve();
        });
      }
      // Fire structural phase, then yield so React can commit `structural` before `finally` runs `imageReady`.
      options?.onStructuralReady?.();
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
      this._projectName = 'Propagated dashboard title';
    }

    dispose = glueDispose;

    subscribeStatus = glueSubscribeStatus;
  },
}));

vi.mock('../engine/core/ImpastoEngine', () => ({
  ImpastoEngine: class MockImpastoEngine {
    image = { set: vi.fn(), get: vi.fn(() => null) };
    dispose = vi.fn();
  },
}));

vi.mock('../services/FirestoreService', () => ({
  renameFirestoreProject: vi.fn().mockResolvedValue(undefined),
  saveFirestoreImageUrl: vi.fn().mockResolvedValue(undefined),
  clearFirestoreProjectImageUrl: vi.fn().mockResolvedValue(undefined),
  getFirestoreProject: vi.fn().mockResolvedValue(null),
}));

/** `useQueryClient` in `ImpastoProjectProvider` requires a client above the tree. */
function renderWithQueryClient(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
  return {
    ...utils,
    /** Same outer wrapper as the initial render so `rerender` does not drop `QueryClientProvider`. */
    rerender: (next: ReactNode) => {
      utils.rerender(<QueryClientProvider client={client}>{next}</QueryClientProvider>);
    },
  };
}

function ProjectNameProbe() {
  const { hydrationPhase, projectName } = useImpastoProject();
  return (
    <>
      <span data-testid="hydrationPhase">{hydrationPhase}</span>
      <span data-testid="projectName">{projectName}</span>
    </>
  );
}

function RenameProbe() {
  const { projectName, renameProjectName } = useImpastoProject();
  return (
    <>
      <span data-testid="projectName">{projectName}</span>
      <button
        type="button"
        data-testid="do-rename"
        onClick={() => void renameProjectName('Renamed from test')}
      >
        rename
      </button>
    </>
  );
}

describe('ImpastoProjectProvider', () => {
  afterEach(() => {
    persistenceGlueMockCtl.stallBeforeStructural = false;
    persistenceGlueMockCtl.releasePastIdleObservation = () => {};
    vi.clearAllMocks();
    cleanup();
  });

  it('exposes glue projectName through context after initialize settles', async () => {
    const { unmount } = renderWithQueryClient(
      <ImpastoProjectProvider projectId="proj-ctx" userId="user-ctx">
        <ProjectNameProbe />
      </ImpastoProjectProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('hydrationPhase').textContent).toBe('imageReady');
    });
    expect(screen.getByTestId('projectName').textContent).toBe('Propagated dashboard title');
    expect(glueSubscribeStatus).toHaveBeenCalled();

    unmount();
    expect(glueDispose).toHaveBeenCalled();
  });

  it('hydrationPhase transitions idle → structural → imageReady during glue.initialize', async () => {
    persistenceGlueMockCtl.stallBeforeStructural = true;

    const { container } = renderWithQueryClient(
      <ImpastoProjectProvider projectId="proj-phase" userId="user-phase">
        <ProjectNameProbe />
      </ImpastoProjectProvider>,
    );

    const probe = () => within(container).getByTestId('hydrationPhase');

    await waitFor(() => {
      expect(probe().textContent).toBe('idle');
    });

    persistenceGlueMockCtl.releasePastIdleObservation();

    await waitFor(() => {
      expect(probe().textContent).toBe('structural');
    });

    await waitFor(() => {
      expect(probe().textContent).toBe('imageReady');
    });
  });

  it('resets hydrationPhase to idle when projectId changes, then reaches imageReady again', async () => {
    persistenceGlueMockCtl.stallBeforeStructural = true;

    function Harness({ projectId }: { projectId: string }) {
      return (
        <ImpastoProjectProvider projectId={projectId} userId="user-stable">
          <ProjectNameProbe />
        </ImpastoProjectProvider>
      );
    }

    const { container, rerender } = renderWithQueryClient(<Harness projectId="proj-a" />);
    const probe = () => within(container).getByTestId('hydrationPhase');

    await waitFor(() => {
      expect(probe().textContent).toBe('idle');
    });
    persistenceGlueMockCtl.releasePastIdleObservation();

    await waitFor(() => {
      expect(probe().textContent).toBe('imageReady');
    });

    rerender(<Harness projectId="proj-b" />);

    await waitFor(() => {
      expect(probe().textContent).toBe('idle');
    });
    persistenceGlueMockCtl.releasePastIdleObservation();

    await waitFor(() => {
      expect(probe().textContent).toBe('imageReady');
    });
  });

  it('renameProjectName writes Firestore and updates displayed title', async () => {
    const { unmount } = renderWithQueryClient(
      <ImpastoProjectProvider projectId="proj-ctx" userId="user-ctx">
        <RenameProbe />
      </ImpastoProjectProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('projectName').textContent).toBe('Propagated dashboard title');
    });

    fireEvent.click(screen.getByTestId('do-rename'));

    await waitFor(() => {
      expect(screen.getByTestId('projectName').textContent).toBe('Renamed from test');
    });
    expect(vi.mocked(renameFirestoreProject)).toHaveBeenCalledWith(
      'user-ctx',
      'proj-ctx',
      'Renamed from test',
    );

    unmount();
  });
});
