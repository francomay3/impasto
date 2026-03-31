import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Color, ProjectState } from '../types';

// hex is always derived at runtime — never persisted
type StoredColor = Omit<Color, 'hex'>;
type StoredProject = Omit<ProjectState, 'sourceImage' | 'createdAt' | 'updatedAt' | 'palette'> & {
  palette: StoredColor[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  imageStorageUrl?: string;
};

function projectsCol(userId: string) {
  return collection(db, 'users', userId, 'projects');
}

function toProjectState(id: string, data: StoredProject): ProjectState {
  return {
    ...data,
    id,
    sourceImage: null,
    palette: (data.palette as Array<StoredColor & { hex?: string }>)
      .filter((c) => c.sample)
      .map(({ hex: _hex, ...c }) => ({ hex: '', ...c })),
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

function toPayload(state: ProjectState) {
  return {
    name: state.name,
    palette: state.palette.map(({ hex: _hex, ...c }) => c),
    groups: state.groups,
    paletteSize: state.paletteSize,
    filters: state.filters,
    preIndexingBlur: state.preIndexingBlur,
    ...(state.imageStorageUrl ? { imageStorageUrl: state.imageStorageUrl } : {}),
  };
}

export async function createFirestoreProject(userId: string, state: ProjectState): Promise<string> {
  const ref = await addDoc(projectsCol(userId), {
    ...toPayload(state),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveFirestoreProject(
  userId: string,
  projectId: string,
  state: ProjectState
): Promise<void> {
  await updateDoc(doc(projectsCol(userId), projectId), {
    ...toPayload(state),
    updatedAt: serverTimestamp(),
  });
}

export async function listFirestoreProjects(userId: string): Promise<ProjectState[]> {
  const q = query(projectsCol(userId), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProjectState(d.id, d.data() as StoredProject));
}

export async function getFirestoreProject(
  userId: string,
  projectId: string
): Promise<ProjectState | null> {
  const snap = await getDoc(doc(projectsCol(userId), projectId));
  if (!snap.exists()) return null;
  return toProjectState(snap.id, snap.data() as StoredProject);
}

export async function saveFirestoreImageUrl(
  userId: string,
  projectId: string,
  imageStorageUrl: string
): Promise<void> {
  await updateDoc(doc(projectsCol(userId), projectId), { imageStorageUrl });
}

export async function renameFirestoreProject(
  userId: string,
  projectId: string,
  name: string
): Promise<void> {
  await updateDoc(doc(projectsCol(userId), projectId), { name, updatedAt: serverTimestamp() });
}

export async function deleteFirestoreProject(userId: string, projectId: string): Promise<void> {
  await deleteDoc(doc(projectsCol(userId), projectId));
}

export interface ExportSettings {
  minPaintPercent: number;
  delta: number;
  selectedPigmentNames: string[];
}

function userDoc(userId: string) {
  return doc(db, 'users', userId);
}

export async function loadExportSettings(userId: string): Promise<ExportSettings | null> {
  const snap = await getDoc(userDoc(userId));
  const data = snap.data();
  return (data?.exportSettings as ExportSettings) ?? null;
}

export async function saveExportSettings(userId: string, settings: ExportSettings): Promise<void> {
  await setDoc(userDoc(userId), { exportSettings: settings }, { merge: true });
}
