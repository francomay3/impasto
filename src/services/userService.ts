import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

function adminDoc(userId: string) {
  return doc(db, 'admins', userId);
}

function userDoc(userId: string) {
  return doc(db, 'users', userId);
}

export async function saveUserProfile(
  userId: string,
  email: string | null,
  displayName: string | null
): Promise<void> {
  await setDoc(userDoc(userId), { email, displayName }, { merge: true });
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const snap = await getDoc(adminDoc(userId));
    return snap.exists();
  } catch {
    return false;
  }
}
