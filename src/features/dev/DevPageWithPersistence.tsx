import { Badge } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db, storage } from '../../firebase';
import { useAuthStore } from '../auth/authStore';
import { FirestoreStorageAdapter } from '../../REFACTOR/persistence/FirestoreStorageAdapter';
import { PersistenceGlue, type PersistenceStatus } from '../../REFACTOR/persistence/PersistenceGlue';
import { useImpastoEngine } from '../../REFACTOR/ImpastoEngine';

type Props = { projectId: string };

/**
 * Mounts persistence for a known project. Must be rendered inside {@link ImpastoEngineProvider}.
 * Only rendered when `/dev/:id` is active and the user is authenticated.
 */
export function DevPageWithPersistence({ projectId }: Props) {
  const engine = useImpastoEngine();
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<PersistenceStatus>('idle');

  useEffect(() => {
    if (!user) {
      return;
    }

    // PersistenceGlue subscribes to the engine in its constructor via engine.subscribeDocumentChanged(),
    // which calls ensureNotDisposed(). In React Strict Mode the passive-effect cleanup/re-run cycle
    // can fire while the engine from the previous layout-effect pass is already disposed. Catch and bail —
    // the real mount (with a live engine) follows immediately.
    let glue: PersistenceGlue;
    try {
      const adapter = new FirestoreStorageAdapter(db, storage, user.uid);
      glue = new PersistenceGlue(engine, adapter);
    } catch {
      return;
    }

    const unsubscribe = glue.subscribeStatus(setStatus);
    void glue.initialize(projectId);

    return () => {
      unsubscribe();
      glue.dispose();
    };
    // projectId intentionally excluded: switching projects requires unmounting this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const color =
    status === 'saved'
      ? 'green'
      : status === 'saving'
        ? 'yellow'
        : status === 'error'
          ? 'red'
          : 'gray';

  return (
    <Badge
      color={color}
      style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 9999 }}
    >
      {status}
    </Badge>
  );
}
