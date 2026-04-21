import { AppShell, Box, LoadingOverlay, Progress, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Fragment, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { AppHeaderV2 } from './AppHeaderV2';
import { FloatingToolOptions } from './FloatingToolOptions';
import { FloatingToolRail } from './FloatingToolRail';
import { PaletteAsideV2 } from './PaletteAsideV2';
import { ViewportsV2 } from './ViewportsV2';
import { ProjectPageV2Mobile } from './ProjectPageV2Mobile';
import { ReplaceImageModal } from '../editor/ReplaceImageModal';
import { ImpastoProjectProvider, useImpastoProject } from '../../providers/ImpastoProjectProvider';
import { useProjectV2ReplaceImage } from './useProjectV2ReplaceImage';
import {
  ensureProjectV2VisitMarked,
  logDocumentNavigationSummaryOnce,
  logEditorStartupPhase,
  logStartupTimingSnapshot,
} from '../../utils/editorStartupTiming';

export function ProjectPageV2() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const visitKey = `${user?.uid ?? ''}:${id ?? ''}:${location.key}`;
  if (user && id) {
    // Logging-only: run before ImpastoProjectProvider so `sinceProjectV2VisitMs` is meaningful.
    ensureProjectV2VisitMarked({ visitKey, projectIdSuffix: id.slice(-6) });
  }

  const navigationSummaryLoggedRef = useRef(false);
  useEffect(() => {
    logDocumentNavigationSummaryOnce(navigationSummaryLoggedRef);
  }, []);

  if (!user || !id) {
    return <LoadingOverlay visible />;
  }

  return (
    <ImpastoProjectProvider projectId={id} userId={user.uid}>
      <ProjectPageV2Shell />
    </ImpastoProjectProvider>
  );
}

function ProjectPageV2Shell() {
  const { hydrationPhase, projectName, renameProjectName, saveStatus } = useImpastoProject();
  const hydratedLoggedRef = useRef(false);
  const allLoadedLoggedRef = useRef(false);
  const { replaceRef, hasDestructiveWork, handleFileSelected, openImportImage, handleNewProjectAfterReplace } =
    useProjectV2ReplaceImage();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  const shellVisible = hydrationPhase !== 'idle';
  const fullyInteractive = hydrationPhase === 'imageReady';

  useEffect(() => {
    if (hydrationPhase === 'idle') {
      hydratedLoggedRef.current = false;
      allLoadedLoggedRef.current = false;
    }
  }, [hydrationPhase]);

  useEffect(() => {
    if (!shellVisible || hydratedLoggedRef.current) {
      return;
    }
    hydratedLoggedRef.current = true;
    logEditorStartupPhase('projectv2:durable state hydrated (overlay can hide)');
  }, [shellVisible]);

  useEffect(() => {
    if (!fullyInteractive || allLoadedLoggedRef.current) {
      return;
    }
    allLoadedLoggedRef.current = true;
    logEditorStartupPhase('projectv2:all loaded (hydration + project name from glue context)', {
      title: projectName.trim() === '' ? '(empty)' : projectName,
    });
    logStartupTimingSnapshot('project v2 ready (full snapshot)');
  }, [fullyInteractive, projectName]);

  if (!shellVisible) {
    return <LoadingOverlay visible />;
  }

  // useMediaQuery returns undefined on first render — only switch to mobile once confirmed
  if (isMobile === true) {
    // Title comes from `PersistenceGlue` via context (same parallel fetch as hydration); no separate query.
    return (
      <ProjectPageV2Mobile
        projectName={projectName}
        isLoading={!fullyInteractive}
        showStructuralHydrationBar={hydrationPhase === 'structural'}
      />
    );
  }

  return (
    <Fragment>
      {hydrationPhase === 'structural' ? (
        // Mantine `Progress` has no true indeterminate mode; full `value` + `animated` reads as activity.
        <Box
          style={{
            position: 'fixed',
            insetInline: 0,
            top: 'var(--app-shell-header-height)',
            zIndex: 101,
            pointerEvents: 'none',
          }}
        >
          <Progress value={100} animated size="xs" radius={0} />
        </Box>
      ) : null}
      <AppShell header={{ height: 68 }} padding={0}>
        <AppHeaderV2
          projectName={projectName}
          isLoading={!fullyInteractive}
          onImportImage={openImportImage}
          onRenameProject={(name) => void renameProjectName(name)}
          saveStatus={saveStatus}
        />
        <AppShell.Main
          style={{
            background: 'var(--mantine-color-dark-9)',
            paddingTop: 'calc(var(--app-shell-header-height) + 4px)',
          }}
        >
          <Box
            style={{
              display: 'flex',
              height: 'calc(100vh - var(--app-shell-header-height))',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                flex: 1,
                minWidth: 0,
                height: '100%',
                position: 'relative',
                // Structural phase: DTO is on the engine but pixels may still be loading — block canvas + tool chrome only
                // (palette aside stays usable if we ever allow picking before imageReady).
                pointerEvents: fullyInteractive ? 'auto' : 'none',
              }}
            >
              <ViewportsV2 />
              <FloatingToolRail />
              <FloatingToolOptions />
            </Box>
            <Box
              style={{
                width: 292,
                flexShrink: 0,
                borderLeft: '1px solid var(--mantine-color-dark-6)',
                background: 'var(--mantine-color-dark-8)',
                overflowY: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              <PaletteAsideV2 />
            </Box>
          </Box>
        </AppShell.Main>
        <ReplaceImageModal
          ref={replaceRef}
          hasSamples={hasDestructiveWork}
          onFileSelected={handleFileSelected}
          onNewProject={handleNewProjectAfterReplace}
        />
      </AppShell>
    </Fragment>
  );
}
