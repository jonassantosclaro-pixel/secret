/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SplashIntroProps {
  onComplete: () => void;
}

export default function SplashIntro({ onComplete }: SplashIntroProps) {
  const [skip, setSkip] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Increment progress bar to match the exact 6 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1.67; // approx (100 / 60 intervals)
      });
    }, 100);

    const timeout = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setSkip(true);
    setTimeout(() => {
      onComplete();
    }, 500); // quick fade out
  };

  // Generate perfume mist particles
  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100 - 50, // relative to center
    y: Math.random() * -180 - 20, // move upwards
    scale: Math.random() * 0.8 + 0.3,
    delay: Math.random() * 2,
    duration: Math.random() * 3 + 2,
  }));

  return (
    <AnimatePresence>
      {!skip && (
        <motion.div
          id="splash-container"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070605] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Faint luxurious background texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(53,37,4,0.18)_0%,rgba(7,6,5,1)_80%)]" />

          {/* Perfume Mist Particles */}
          <div className="absolute inset-x-0 bottom-1/4 top-0 flex items-center justify-center pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-1 h-1 bg-gradient-to-tr from-gold-300 to-gold-100 rounded-full blur-[1px]"
                style={{
                  x: `${p.x}vw`,
                  y: '10vh',
                }}
                initial={{ opacity: 0, y: '30vh', scale: 0 }}
                animate={{
                  opacity: [0, 0.7, 0.4, 0],
                  y: [`30vh`, `${p.y}px`],
                  x: [`${p.x}vw`, `${p.x + (Math.random() * 10 - 5)}vw`],
                  scale: [p.scale, p.scale * 1.5, p.scale],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Logo Brand Animation */}
          <div className="relative flex flex-col items-center justify-center z-10 p-6 text-center">
            {/* Shifting golden aura glow */}
            <motion.div
              className="absolute w-64 h-64 bg-gold-400/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Main Circular Logo Frame */}
            <motion.div
              id="splash-logo-frame"
              className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden border border-gold-300/30 p-1 flex items-center justify-center shadow-[0_0_50px_rgba(219,191,100,0.1)] mb-8 bg-[#0b0a08]"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-400/20 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '3s' }} />

              <motion.img
                src="https://i.postimg.cc/6qJnp9Ld/Chat-GPT-Image-6-06-2026-12-02-47.png"
                alt="Secret Fragrance Logo"
                className="w-full h-full object-contain p-2 rounded-full"
                referrerPolicy="no-referrer"
                initial={{ filter: "brightness(0.5) contrast(1.2)" }}
                animate={{ 
                  filter: [
                    "brightness(0.7) contrast(1.2)",
                    "brightness(1.1) contrast(1.4) drop-shadow(0 0 15px rgba(219,191,100,0.4))",
                    "brightness(0.9) contrast(1.2)"
                  ] 
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            {/* Typography */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1.2 }}
            >
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-[0.25em] text-shimmer-gold">
                S E C R E T
              </h1>
              <h2 className="font-display text-lg sm:text-xl font-medium tracking-[0.4em] text-gold-200 mt-2">
                F R A G R A N C E
              </h2>
              <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-gold-400 to-transparent mx-auto mt-4" />
              <p className="font-serif italic text-xs text-gold-100/50 mt-3 tracking-[0.1em]">
                Authentic Arabian Masterpieces & Niche Perfumery
              </p>
            </motion.div>
          </div>

          {/* Progress bar at bottom */}
          <div className="absolute bottom-16 w-64 sm:w-80 h-[2px] bg-neutral-900 overflow-hidden rounded-full z-10">
            <motion.div 
              className="h-full bg-gradient-to-r from-gold-650 via-gold-300 to-gold-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Action to skip intro */}
          <motion.button
            id="skip-intro-btn"
            onClick={handleSkip}
            className="absolute bottom-6 flex items-center gap-1 text-xs tracking-widest text-gold-300/40 hover:text-gold-300 transition-colors uppercase bg-transparent p-2 rounded z-20 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
          >
            Skip Intro
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
