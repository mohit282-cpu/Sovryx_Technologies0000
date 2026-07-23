'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ShieldAlert, Key, Users, ChevronRight, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { comparePassword, hashPassword } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Query users collection for this Employee ID
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('employeeId', '==', employeeId.trim()), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('Employee ID not found in system.');
        setLoading(false);
        return;
      }

      const userDoc = snap.docs[0];
      const userData = userDoc.data();
      const oldDocId = userDoc.id;

      // 2. Enforce Role Separation (Allowed Admin Portal Roles)
      const allowedRoles = ['CEO', 'Admin', 'HR', 'Manager'];
      if (!allowedRoles.includes(userData.role)) {
        setError('Access Denied: Please use the Employee Portal at /employee/login.');
        setLoading(false);
        return;
      }

      // Check for Suspended/Inactive status
      if (userData.status === 'Suspended' || userData.status === 'Inactive' || userData.status === 'Terminated') {
        setError(`Access Denied: Your account is currently ${userData.status}.`);
        setLoading(false);
        return;
      }

      let firebaseUid = userData.uid;

      // 3. Authenticate with Firebase Auth or Migrate Legacy pre-seeded users
      if (firebaseUid) {
        // Active Firebase Auth account exists - use it securely
        try {
          const authCred = await signInWithEmailAndPassword(auth, userData.email, password);
          firebaseUid = authCred.user.uid;
        } catch (authErr: any) {
          console.error('Firebase Auth sign-in failed:', authErr);
          setError('Invalid Employee ID or password.');
          setLoading(false);
          return;
        }
      } else {
        // Pre-seeded user with password hash inside Firestore. Authenticate via comparePassword.
        if (userData.password && comparePassword(password, userData.password)) {
          try {
            // Register them in Firebase Authentication securely
            const authCred = await createUserWithEmailAndPassword(auth, userData.email, password);
            firebaseUid = authCred.user.uid;

            // Migrate document to be indexed by Firebase UID as the primary key
            await setDoc(doc(db, 'users', firebaseUid), {
              ...userData,
              uid: firebaseUid,
              id: firebaseUid,
              password: null, // Wipe the cleartext password/hash from Firestore for security compliance
              updatedAt: new Date().toISOString()
            });

            // Delete old temporary un-indexed document
            if (oldDocId !== firebaseUid) {
              await deleteDoc(doc(db, 'users', oldDocId));
            }
          } catch (regErr: any) {
            console.error('Migration to Firebase Auth failed:', regErr);
            // If email is already taken in Firebase Auth (e.g., from a prior partial run), we can update UID
            if (regErr.code === 'auth/email-already-in-use') {
              try {
                // Sign in with default credentials instead
                const authCred = await signInWithEmailAndPassword(auth, userData.email, password);
                firebaseUid = authCred.user.uid;
                await setDoc(doc(db, 'users', firebaseUid), {
                  ...userData,
                  uid: firebaseUid,
                  id: firebaseUid,
                  password: null,
                  updatedAt: new Date().toISOString()
                });
                if (oldDocId !== firebaseUid) {
                  await deleteDoc(doc(db, 'users', oldDocId));
                }
              } catch (subErr: any) {
                setError('Authentication setup failed. Contact system administrator.');
                setLoading(false);
                return;
              }
            } else {
              setError('Failed to securely register account.');
              setLoading(false);
              return;
            }
          }
        } else {
          setError('Invalid Employee ID or password.');
          setLoading(false);
          return;
        }
      }

      // 4. Save Session (localStorage & HTTP cookies for Next.js Middleware protection)
      const sessionData = {
        uid: firebaseUid,
        employeeId: userData.employeeId,
        name: userData.fullName || userData.name,
        role: userData.role,
        email: userData.email,
        forcePasswordChange: userData.forcePasswordChange || false
      };

      localStorage.setItem('sovryx_admin_session', JSON.stringify(sessionData));
      document.cookie = `sovryx_admin_session=${JSON.stringify(sessionData)}; path=/; max-age=86400; SameSite=Lax`;

      // Redirect to Admin dashboard
      router.replace('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (empId: string) => {
    setEmployeeId(empId);
    setPassword('password123');
  };

  return (
    <div id="admin-login-view" className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 mb-4 border border-indigo-500/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Sovryx Company OS</h1>
          <p className="text-xs text-slate-400 mt-1">Admin & Executive Portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Employee ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="EMP0001"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Sign In to Admin Portal'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
          <p className="text-[11px] text-slate-400">Quick Test Credentials (Password: password123):</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              type="button" 
              onClick={() => handleQuickFill('EMP0001')} 
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-indigo-300 font-mono transition-colors cursor-pointer"
            >
              CEO: EMP0001
            </button>
            <button 
              type="button" 
              onClick={() => handleQuickFill('EMP0002')} 
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-indigo-300 font-mono transition-colors cursor-pointer"
            >
              Admin: EMP0002
            </button>
            <button 
              type="button" 
              onClick={() => handleQuickFill('EMP0003')} 
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-indigo-300 font-mono transition-colors cursor-pointer"
            >
              HR: EMP0003
            </button>
          </div>
          <div className="mt-4">
            <button 
              type="button" 
              onClick={() => router.push('/employee/login')}
              className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 transition-all cursor-pointer"
            >
              Switch to Employee Portal <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
