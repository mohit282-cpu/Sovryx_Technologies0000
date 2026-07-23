'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Key, ChevronRight, Loader2, Lock, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { comparePassword, hashPassword } from '@/lib/auth';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // First Login change password state
  const [showForceChange, setShowForceChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);

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

      // 2. Enforce Role (Only Employee can log in to this portal)
      if (userData.role !== 'Employee') {
        setError('Access Denied: Please use the Administrative Portal at /login.');
        setLoading(false);
        return;
      }

      // Check status
      if (userData.status === 'Suspended' || userData.status === 'Inactive' || userData.status === 'Terminated') {
        setError(`Access Denied: Your account is currently ${userData.status}.`);
        setLoading(false);
        return;
      }

      let firebaseUid = userData.uid;

      // 3. Authenticate and Migrate legacy pre-seeded users
      if (firebaseUid) {
        try {
          const authCred = await signInWithEmailAndPassword(auth, userData.email, password);
          firebaseUid = authCred.user.uid;
        } catch (authErr: any) {
          console.error('Firebase Auth login failed:', authErr);
          setError('Invalid Employee ID or password.');
          setLoading(false);
          return;
        }
      } else {
        // Legacy/pre-seeded user authentication check
        if (userData.password && comparePassword(password, userData.password)) {
          try {
            const authCred = await createUserWithEmailAndPassword(auth, userData.email, password);
            firebaseUid = authCred.user.uid;

            // Migrate document to be indexed by Firebase UID as the primary key
            await setDoc(doc(db, 'users', firebaseUid), {
              ...userData,
              uid: firebaseUid,
              id: firebaseUid,
              password: null, // security hygiene
              updatedAt: new Date().toISOString()
            });

            if (oldDocId !== firebaseUid) {
              await deleteDoc(doc(db, 'users', oldDocId));
            }
          } catch (regErr: any) {
            console.error('Migration failed:', regErr);
            if (regErr.code === 'auth/email-already-in-use') {
              try {
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

      // Check for First Login flag
      if (userData.forcePasswordChange === true) {
        setTempUser({
          uid: firebaseUid,
          employeeId: userData.employeeId,
          role: userData.role,
          email: userData.email,
          fullName: userData.fullName || userData.name
        });
        setShowForceChange(true);
        setLoading(false);
        return;
      }

      // 4. Save Session (localStorage & HTTP cookies for Next.js Middleware protection)
      const sessionData = {
        uid: firebaseUid,
        employeeId: userData.employeeId,
        name: userData.fullName || userData.name,
        role: userData.role,
        email: userData.email,
        forcePasswordChange: false
      };

      localStorage.setItem('sovryx_employee_session', JSON.stringify(sessionData));
      document.cookie = `sovryx_employee_session=${JSON.stringify(sessionData)}; path=/; max-age=86400; SameSite=Lax`;

      // Redirect to Employee Portal Home
      router.replace('/employee/dashboard');
    } catch (err: any) {
      console.error('Employee login error:', err);
      setError('An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const currentUserObj = auth.currentUser;
      if (!currentUserObj) {
        setError('Session expired. Please log in again.');
        setShowForceChange(false);
        setLoading(false);
        return;
      }

      // Update password in Firebase Authentication securely
      await updatePassword(currentUserObj, newPassword);

      // Update Firestore user profile
      await setDoc(doc(db, 'users', tempUser.uid), {
        forcePasswordChange: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Save complete session
      const sessionData = {
        uid: tempUser.uid,
        employeeId: tempUser.employeeId,
        name: tempUser.fullName,
        role: tempUser.role,
        email: tempUser.email,
        forcePasswordChange: false
      };

      localStorage.setItem('sovryx_employee_session', JSON.stringify(sessionData));
      document.cookie = `sovryx_employee_session=${JSON.stringify(sessionData)}; path=/; max-age=86400; SameSite=Lax`;

      // Redirect
      router.replace('/employee/dashboard');
    } catch (err: any) {
      console.error('Password update failed:', err);
      setError(err.message || 'Failed to update password. Try logging in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmployeeId('EMP0005');
    setPassword('password123');
  };

  return (
    <div id="employee-login-view" className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <AnimatePresence mode="wait">
        {!showForceChange ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 mb-4 border border-emerald-500/30">
                <Users className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Sovryx Employee Portal</h1>
              <p className="text-xs text-slate-400 mt-1">Sign in with Employee ID</p>
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
                  placeholder="EMP0005"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
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
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Sign In to Employee Portal'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
              <p className="text-[11px] text-slate-400">Quick Test Credentials (Password: password123):</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-emerald-300 font-mono transition-colors cursor-pointer"
                >
                  Employee: EMP0005
                </button>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 transition-all cursor-pointer"
                >
                  Switch to Admin Portal <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="password-change-form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mb-4 border border-amber-500/30 animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Setup Secure Password</h1>
              <p className="text-xs text-slate-400 mt-1">
                Hi, <span className="text-amber-400 font-semibold">{tempUser?.fullName}</span>. Since this is your first sign-in, you must configure a secure personal password.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Secure Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Activate Account & Enter Portal <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
