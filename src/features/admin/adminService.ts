import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export async function listAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      email: (data.email as string | null) ?? null,
      displayName: (data.displayName as string | null) ?? null,
    };
  });
}
