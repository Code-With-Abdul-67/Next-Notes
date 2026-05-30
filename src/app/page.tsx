"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { Spinner } from "@nextui-org/react";
import { motion } from "framer-motion";
import Dashboard from "@/frontend/components/layout/Dashboard";
import Image from 'next/image';


export default function HomePage() {
  const { data: session, status } = useSession();

  // Register service worker on mount
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) =>
        console.error("Service worker registration failed:", err)
      );
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner color="secondary" size="lg" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}

function LoginScreen() {
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden px-4">
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #4C1D95 0%, transparent 70%)" }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -25, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #6D28D9 0%, transparent 70%)" }}
        animate={{
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel rounded-3xl p-10 max-w-sm w-full text-center relative z-10 border border-white/10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
          className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/25"
        >
          <Image src="/favicon.ico" alt="Logo" width={40} height={40} className="object-contain" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-3xl font-extrabold mb-2 text-white"
        >
          NEXT Notes
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-sm text-white/50 mb-8 leading-relaxed"
        >
          Your premium, secure, and beautifully designed note-taking workspace. Sign in to continue.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <button
            onClick={() => signIn("google")}
            className="btn-sheen w-full h-12 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/20 transition-all duration-300 hover:shadow-purple-600/40 hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-[10px] text-white/30 leading-relaxed"
        >
          By signing in you agree to NEXT Notes terms.
          <br />
          Your data is securely stored with end-to-end encryption.
        </motion.p>
      </motion.div>
    </div>
  );
}
