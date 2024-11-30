import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const auth = getAuth();

export const authService = {
  // Check if any support users exist
  checkFirstTimeSetup: async () => {
    try {
      const supportUsersRef = doc(db, 'supportUsers', 'initialSetup');
      const docSnap = await getDoc(supportUsersRef);
      return !docSnap.exists();
    } catch (error) {
      console.error('First-time setup check error:', error);
      throw error;
    }
  },

  // Customer Support Login
  loginSupport: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  // Register new support user
  registerSupport: async (email, password, additionalInfo) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user info in Firestore
      await setDoc(doc(db, 'supportUsers', user.uid), {
        email: user.email,
        role: 'support',
        ...additionalInfo,
        createdAt: new Date()
      });

      // Mark initial setup as complete
      await setDoc(doc(db, 'supportUsers', 'initialSetup'), { 
        initialized: true 
      });

      return user;
    } catch (error) {
      console.error('Registration Error:', error);
      throw error;
    }
  },
// In authService.js
getCurrentUser: () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
},
  // Logout
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  }
};