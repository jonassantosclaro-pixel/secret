/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Lock, Phone, User as UserIcon, Sparkles } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (user: any, profile: any) => void;
}

export default function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must contain at least 6 digits/characters.');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Sign up with Firebase Auth
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        // Custom update auth profile
        await updateProfile(user, { displayName: fullName });

        // Build UserProfile Document in Firestore
        const profileData = {
          uid: user.uid,
          fullName: fullName,
          email: email.trim().toLowerCase(),
          phone: phone,
          isAdmin: email.trim().toLowerCase() === "secret@x.com", // Bootstrap secret admin
          createdAt: new Date()
        };

        await setDoc(doc(db, 'users', user.uid), profileData);
        onAuthSuccess(user, profileData);
        onClose();
      } else {
        // Sign in with Firebase Auth
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          const user = credential.user;
          onAuthSuccess(user, null); // Parent App will pick up the firestore user document
          onClose();
        } catch (err: any) {
          // If admin tries to sign in but account doesn't exist yet, automatically register them!
          if (email.trim().toLowerCase() === "secret@x.com" && password === "secret4321") {
            console.log("Admin account not found. Creating bootstrap admin profile...");
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const user = credential.user;
            await updateProfile(user, { displayName: "Secret Admin" });

            const profileData = {
              uid: user.uid,
              fullName: "Secret Admin",
              email: email.trim().toLowerCase(),
              phone: "+1 (561) 668-7361",
              isAdmin: true,
              createdAt: new Date()
            };

            await setDoc(doc(db, 'users', user.uid), profileData);
            // Also store bootstrap admin ID under admins collection
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: "secret@x.com"
            });

            onAuthSuccess(user, profileData);
            onClose();
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      console.error("Auth Failure:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered.');
      } else if (err.code === 'auth/invalid-login-credentials' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid login details. Try secret@x.com / secret4321');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div 
        id="auth-modal-box"
        className="relative w-full max-w-sm bg-[#0a0907] border border-gold-300/20 rounded-xl p-6 sm:p-8 shadow-[0_0_80px_rgba(219,191,100,0.12)] space-y-6 select-none"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white bg-[#0e0d0c] border border-gold-300/10 hover:border-gold-300/30 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Branding header */}
        <div className="text-center space-y-2">
          <img 
            src="https://i.postimg.cc/6qJnp9Ld/Chat-GPT-Image-6-06-2026-12-02-47.png" 
            alt="Secret Fragrance Logo" 
            className="w-14 h-14 mx-auto object-contain rounded-full border border-gold-300/10 p-0.5"
            referrerPolicy="no-referrer"
          />
          <div>
            <h3 className="font-display text-sm tracking-[0.2em] text-shimmer-gold font-bold">SECRET</h3>
            <p className="font-display text-[9px] tracking-[0.3em] text-gold-300">FRAGRANCE</p>
          </div>
          <p className="text-[11px] text-zinc-400 font-serif">
            {isRegister ? 'Register your luxury profile' : 'Sign in to access precious values'}
          </p>
        </div>

        {/* Auth Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded font-sans italic text-center">
            {error}
          </div>
        )}

        {/* Form layout */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {isRegister && (
            <>
              {/* Full name input */}
              <div>
                <label className="block text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gold-400/50">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g., Jonathan Santos"
                    className="w-full bg-[#13110e] border border-gold-300/15 rounded py-2.5 pl-9 pr-3 text-xs text-gold-100 placeholder-zinc-650 focus:outline-none focus:border-gold-400 transition-all"
                  />
                </div>
              </div>

              {/* Phone number input */}
              <div>
                <label className="block text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Phone *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gold-400/50">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="E.g., +1 (561) 668-7361"
                    className="w-full bg-[#13110e] border border-gold-300/15 rounded py-2.5 pl-9 pr-3 text-xs text-gold-100 placeholder-zinc-650 focus:outline-none focus:border-gold-400 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email input */}
          <div>
            <label className="block text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gold-400/50">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@secret.com"
                className="w-full bg-[#13110e] border border-gold-300/15 rounded py-2.5 pl-9 pr-3 text-xs text-gold-100 placeholder-zinc-650 focus:outline-none focus:border-gold-400 transition-all"
              />
            </div>
          </div>

          {/* Password Pin Input */}
          <div>
            <label className="block text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Password pincode (min 6 characters) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gold-400/50">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-[#13110e] border border-gold-300/15 rounded py-2.5 pl-9 pr-3 text-xs text-gold-100 placeholder-zinc-650 focus:outline-none focus:border-gold-400 transition-all"
              />
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-gold-300 to-gold-400 hover:brightness-110 text-neutral-950 font-bold text-xs uppercase tracking-widest rounded shadow-[0_4px_15px_rgba(219,191,100,0.15)] cursor-pointer transition-all disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-950 animate-spin" />
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

        </form>

        {/* Change Mode */}
        <div className="text-center space-y-3 pt-2">
          <p className="text-[11px] text-zinc-500">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-gold-400 ml-1.5 hover:underline text-[11.5px] bg-transparent cursor-pointer font-semibold"
            >
              {isRegister ? 'Login here' : 'SignUp here'}
            </button>
          </p>

          <div className="flex items-center justify-center gap-3">
            <span className="w-8 h-[1px] bg-gold-300/10" />
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">or</span>
            <span className="w-8 h-[1px] bg-gold-300/10" />
          </div>

          {/* Continue as Guest fallback */}
          <button
            onClick={onClose}
            className="w-full py-2 bg-[#12100d] hover:bg-[#181613] border border-gold-300/10 hover:border-gold-300/20 text-gold-300/70 hover:text-gold-200 text-[10px] uppercase font-bold tracking-widest rounded transition-all cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>

      </div>
    </div>
  );
}
