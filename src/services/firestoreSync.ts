import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { firestore, handleFirestoreError, OperationType } from './firebase';
import {
  User,
  Student,
  Faculty,
  Subject,
  Lecture,
  AttendanceRecord,
  CollegeSettings,
  EnrollmentRegistryEntry,
  GmailNotification
} from '../types';

export interface CloudSyncStatus {
  connected: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  cloudRecordCounts: {
    students: number;
    lectures: number;
    attendances: number;
    subjects: number;
  };
  error: string | null;
}

class FirestoreSyncService {
  private syncStatus: CloudSyncStatus = {
    connected: false,
    isSyncing: false,
    lastSyncedAt: null,
    cloudRecordCounts: {
      students: 0,
      lectures: 0,
      attendances: 0,
      subjects: 0
    },
    error: null
  };

  private listenersInitialized = false;

  public getStatus(): CloudSyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Initializes real-time listeners for all Firestore collections with strict error handling.
   */
  public initRealTimeListeners(onDataUpdated: (collectionName: string) => void) {
    if (this.listenersInitialized) return;
    this.listenersInitialized = true;

    const collectionsToListen = [
      { name: 'students', storageKey: 'sca_students' },
      { name: 'lectures', storageKey: 'sca_lectures' },
      { name: 'attendances', storageKey: 'sca_attendance' },
      { name: 'subjects', storageKey: 'sca_subjects' },
      { name: 'users', storageKey: 'sca_users' },
      { name: 'faculty', storageKey: 'sca_faculty' },
      { name: 'collegeSettings', storageKey: 'sca_settings' },
      { name: 'enrollmentRegistry', storageKey: 'sca_enrollment_registry' },
      { name: 'gmailNotifications', storageKey: 'sca_gmail_notifications' }
    ];

    collectionsToListen.forEach(({ name, storageKey }) => {
      try {
        const colRef = collection(firestore, name);
        onSnapshot(
          colRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                items.push(docSnap.data());
              });

              if (name === 'collegeSettings') {
                if (items.length > 0) {
                  localStorage.setItem(storageKey, JSON.stringify(items[0]));
                }
              } else {
                localStorage.setItem(storageKey, JSON.stringify(items));
              }

              this.syncStatus.connected = true;
              this.syncStatus.lastSyncedAt = Date.now();
              this.syncStatus.error = null;

              if (name === 'students') this.syncStatus.cloudRecordCounts.students = items.length;
              if (name === 'lectures') this.syncStatus.cloudRecordCounts.lectures = items.length;
              if (name === 'attendances') this.syncStatus.cloudRecordCounts.attendances = items.length;
              if (name === 'subjects') this.syncStatus.cloudRecordCounts.subjects = items.length;

              onDataUpdated(name);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('sca_cloud_db_synced', { detail: { collection: name, count: items.length } }));
              }
            } else {
              this.syncStatus.connected = true;
            }
          },
          (error) => {
            // Strictly handled per security requirements
            this.syncStatus.connected = false;
            this.syncStatus.error = error.message;
            handleFirestoreError(error, OperationType.GET, name);
          }
        );
      } catch (err) {
        console.error(`Error setting up snapshot for ${name}:`, err);
      }
    });
  }

  /**
   * Pushes a single document to Firestore
   */
  public async setDocument(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      const docRef = doc(firestore, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
      this.syncStatus.lastSyncedAt = Date.now();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  }

  /**
   * Deletes a single document from Firestore
   */
  public async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(firestore, collectionName, docId);
      await deleteDoc(docRef);
      this.syncStatus.lastSyncedAt = Date.now();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
    }
  }

  /**
   * Seeds initial baseline data to Firestore if the cloud collections are empty
   */
  public async seedInitialDataIfEmpty(baseline: {
    students: Student[];
    lectures: Lecture[];
    faculty: Faculty[];
    subjects: Subject[];
    users: User[];
    settings: CollegeSettings;
    registry: EnrollmentRegistryEntry[];
    attendance: AttendanceRecord[];
  }) {
    try {
      this.syncStatus.isSyncing = true;
      const studentsCol = collection(firestore, 'students');
      const snap = await getDocs(studentsCol);

      if (snap.empty) {
        console.log('Seeding initial baseline data to Firebase Firestore...');

        // 1. Settings
        await this.setDocument('collegeSettings', baseline.settings.id || 'settings_1', baseline.settings);

        // 2. Users
        for (const u of baseline.users) {
          await this.setDocument('users', u.id, u);
        }

        // 3. Faculty
        for (const f of baseline.faculty) {
          await this.setDocument('faculty', f.id, f);
        }

        // 4. Subjects
        for (const s of baseline.subjects) {
          await this.setDocument('subjects', s.id, s);
        }

        // 5. Students & Registry
        for (const st of baseline.students) {
          await this.setDocument('students', st.id, st);
        }
        for (const r of baseline.registry) {
          await this.setDocument('enrollmentRegistry', r.enrollmentNumber.toUpperCase(), r);
        }

        // 6. Lectures
        for (const l of baseline.lectures) {
          await this.setDocument('lectures', l.id, l);
        }

        // 7. Attendance records
        for (const a of baseline.attendance) {
          await this.setDocument('attendances', a.id, a);
        }

        console.log('Firebase Firestore successfully populated with all baseline academic data!');
      } else {
        console.log('Firebase Firestore already populated, syncing cloud collections.');
      }

      this.syncStatus.connected = true;
      this.syncStatus.isSyncing = false;
      this.syncStatus.lastSyncedAt = Date.now();
    } catch (error) {
      this.syncStatus.isSyncing = false;
      this.syncStatus.error = error instanceof Error ? error.message : String(error);
      console.warn('Initial Firestore seed check notice:', error);
    }
  }
}

export const firestoreSync = new FirestoreSyncService();
