/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';

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

  // Predefined sparkling stars positions
  const stars = useMemo(() => [
    { id: 1, top: '6%', left: '12%', size: '2px', delay: 0 },
    { id: 2, top: '14%', left: '28%', size: '1.5px', delay: 0.5 },
    { id: 3, top: '25%', left: '10%', size: '2px', delay: 1.2 },
    { id: 4, top: '4%', left: '48%', size: '3px', delay: 1.8 },
    { id: 5, top: '18%', left: '74%', size: '2.5px', delay: 0.8 },
    { id: 6, top: '9%', left: '88%', size: '2px', delay: 1.4 },
    { id: 7, top: '30%', left: '82%', size: '1.5px', delay: 0.3 },
    { id: 8, top: '22%', left: '24%', size: '2px', delay: 2.1 },
    { id: 9, top: '38%', left: '8%', size: '1.5px', delay: 1.6 },
    { id: 10, top: '34%', left: '94%', size: '2px', delay: 2.5 },
    { id: 11, top: '5%', left: '76%', size: '1px', delay: 0.9 },
    { id: 12, top: '12%', left: '44%', size: '2px', delay: 1.0 },
    { id: 13, top: '28%', left: '62%', size: '1.5px', delay: 0.2 },
    { id: 14, top: '16%', left: '55%', size: '2px', delay: 1.5 },
    { id: 15, top: '32%', left: '40%', size: '1.5px', delay: 0.7 },
  ], []);

  // Predefined blue smoke/ember particles
  const blueEmbers = useMemo(() => Array.from({ length: 38 }).map((_, i) => ({
    id: i,
    left: `${5 + Math.random() * 90}%`,
    top: `${-12 + Math.random() * 24}%`,
    scale: Math.random() * 2.8 + 0.6,
    delay: Math.random() * 3,
    duration: Math.random() * 2.5 + 2.5,
    xOffset: Math.random() * 60 - 30,
    yOffset: Math.random() * -65 - 30, // Float higher for intense mist effect
  })), []);

  // Descending golden luxury dust particles representing the premium spray note
  const goldDust = useMemo(() => Array.from({ length: 22 }).map((_, i) => ({
    id: i,
    left: `${15 + Math.random() * 70}%`,
    top: `${5 + Math.random() * 35}%`,
    scale: Math.random() * 2.0 + 0.4,
    delay: Math.random() * 2,
    duration: Math.random() * 4 + 3,
    xOffset: Math.random() * 40 - 20,
    yOffset: Math.random() * 80 + 60, // Falls downwards beautifully
  })), []);

  return (
    <AnimatePresence>
      {!skip && (
        <motion.div
          id="splash-container"
          className="fixed inset-0 z-50 flex flex-col items-center justify-between luxe-wallpaper overflow-hidden select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* 1. LAYER: Deep cosmic ambient textures & spotlight ray */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          
          {/* Top downward spotlight cone - amplified premium electric blue and cyan rays */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[420px] sm:w-[800px] h-[75vh] bg-gradient-to-b from-blue-600/25 via-cyan-800/15 to-transparent rounded-b-full blur-[110px] pointer-events-none z-0" />
          
          {/* Ambient center gold and blue nebula aura */}
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[400px] sm:w-[650px] h-[50vh] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(219,191,100,0.15) 0%, rgba(6,182,212,0.18) 35%, rgba(29,78,216,0.18) 70%, transparent 100%)' }} />

          {/* Golden expanding light ring wave at startup - High luxury impact */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 0.45, 0], scale: [0.2, 1.4, 1.8] }}
            transition={{ duration: 3.5, ease: "easeOut", repeat: Infinity, repeatDelay: 4 }}
            className="absolute top-[28%] left-1/2 -translate-x-1/2 w-72 h-72 sm:w-[500px] sm:h-[500px] rounded-full border border-gold-300/10 pointer-events-none blur-[4px] z-0 mix-blend-screen"
          />

          {/* Sparkly twinkling stars */}
          {stars.map((s) => (
            <motion.div
              key={s.id}
              className="absolute rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] z-10"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
              }}
              animate={{
                opacity: [0.1, 1, 0.1],
                scale: [0.8, 1.35, 0.8],
              }}
              transition={{
                duration: s.duration || Math.random() * 2 + 1.8,
                repeat: Infinity,
                delay: s.delay,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Descending luxury golden sparkles/dust */}
          {goldDust.map((g) => (
            <motion.div
              key={`gold-${g.id}`}
              className="absolute rounded-full bg-gradient-to-br from-gold-100 to-gold-400 opacity-0 z-10 shadow-[0_0_6px_#dbbf64]"
              style={{
                left: g.left,
                top: g.top,
                width: `${1.5 * g.scale}px`,
                height: `${1.5 * g.scale}px`,
              }}
              animate={{
                opacity: [0, 0.85, 0.5, 0],
                x: [0, g.xOffset],
                y: [0, g.yOffset],
                scale: [0.5, 1.2, 0.6],
              }}
              transition={{
                duration: g.duration,
                repeat: Infinity,
                delay: g.delay,
                ease: "linear",
              }}
            />
          ))}

          {/* 2. LAYER: Center Logo & Ground Reflection Scene */}
          <div className="relative flex flex-col items-center justify-center py-4 z-10 w-full max-w-xl mx-auto mt-[7vh] sm:mt-[9vh]">
            
            {/* Ambient gold background halo glow right under the S (Enriched and expanded size) */}
            <motion.div
              className="absolute w-96 h-96 sm:w-[600px] sm:h-[600px] rounded-full bg-[#dbbf64]/18 mix-blend-screen blur-[140px]"
              initial={{ opacity: 0, scale: 0.65 }}
              animate={{ opacity: [0, 0.95, 0.65, 0.85], scale: [0.65, 1.35, 0.95, 1.12] }}
              transition={{ duration: 3.5, ease: "easeOut" }}
            />

            {/* GRAND INSPIRED AND SPLENDID BLUE GLOW - Innovative and Professional Neon Bloom behind the logo */}
            <motion.div
              className="absolute w-[450px] h-[450px] sm:w-[700px] sm:h-[700px] rounded-full bg-gradient-to-tr from-cyan-500/25 via-blue-600/20 to-indigo-500/10 mix-blend-screen blur-[110px]"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 0.7, 0.9], scale: [0.6, 1.3, 0.95, 1.1] }}
              transition={{ duration: 4.5, ease: "easeOut" }}
            />
            
            {/* Main Floating Golden S Logo with slow luxury breathing float */}
            <motion.div
              id="splash-main-logo"
              initial={{ opacity: 0, y: -65, scale: 0.75 }}
              animate={{ 
                opacity: 1, 
                y: [0, -15, 0],
                scale: 1.05
              }}
              transition={{ 
                opacity: { duration: 2.5, ease: [0.16, 1, 0.3, 1] },
                y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 2.5, ease: [0.16, 1, 0.3, 1] }
              }}
              className="relative z-20 flex justify-center items-center"
            >
              {/* Golden circular highlight shimmer */}
              <div className="absolute inset-0 bg-radial-gradient from-white/15 to-transparent rounded-full blur-[30px] mix-blend-screen pointer-events-none" />
              
              <img
                src="https://i.postimg.cc/ht7MNG1H/Chat-GPT-Image-9-06-2026-10-55-29.png"
                alt="Secret Fragrance Logo"
                className="w-80 h-80 sm:w-[500px] sm:h-[500px] object-contain filter drop-shadow-[0_0_80px_rgba(6,182,212,0.85)] drop-shadow-[0_0_35px_rgba(219,191,100,0.6)] rounded-full transition-transform duration-1000 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Blue Magical mist/electrical horizontal separator exactly like the photo - HIGH IMPACT */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.15 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.7, duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-16 w-full flex items-center justify-center -my-12 sm:-my-20 z-30 overflow-visible"
            >
              {/* Central pure white electrical filament line with enhanced pulsing bloom */}
              <div className="absolute h-[5px] w-[98%] max-w-[700px] bg-gradient-to-r from-transparent via-white via-[#e2f8ff] to-transparent shadow-[0_0_30px_#22d3ee,0_0_60px_#06b6d4,0_0_90px_#0891b2] opacity-100 animate-pulse" />
              
              {/* Thick cyan laser stream glow */}
              <div className="absolute h-[10px] w-[95%] max-w-[650px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_45px_#0891b2,0_0_90px_#1d4ed8] opacity-98" />
              
              {/* Intense cyan vapor fog/mist cloud rolling across the horizon */}
              <motion.div 
                animate={{ 
                  scaleY: [0.85, 1.5, 0.85],
                  opacity: [0.5, 0.85, 0.5]
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute h-16 w-[85%] max-w-[600px] bg-gradient-to-r from-transparent via-cyan-400/50 via-blue-500/30 to-transparent blur-[25px] mix-blend-screen" 
              />
              
              {/* Deep immersive blue visual atmosphere bloom */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.35, 0.65, 0.35]
                }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="absolute h-32 w-[100%] max-w-[750px] bg-gradient-to-r from-transparent via-blue-600/40 to-transparent blur-[50px] mix-blend-screen" 
              />

              {/* Magical vapor particles/luminescent smoke rising high, matching image style */}
              {blueEmbers.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-cyan-200/80 shadow-[0_0_10px_rgba(34,211,238,0.95)] blur-[0.5px]"
                  style={{
                    left: p.left,
                    top: p.top,
                    width: `${2.6 * p.scale}px`,
                    height: `${2.6 * p.scale}px`,
                  }}
                  animate={{
                    opacity: [0, 0.98, 0],
                    x: [0, p.xOffset],
                    y: [0, p.yOffset],
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                />
              ))}
            </motion.div>

            {/* Mirrored ground reflection of the S logo (scaled larger to match, beautiful gradient fade) */}
            <motion.div
              initial={{ opacity: 0, scaleY: -0.1 }}
              animate={{ opacity: 0.45, scaleY: -0.65 }}
              transition={{ delay: 0.5, duration: 2.6, ease: "easeOut" }}
              className="relative z-10 origin-top blur-[3px] -mt-3.5 select-none pointer-events-none"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
              }}
            >
              <img
                src="https://i.postimg.cc/ht7MNG1H/Chat-GPT-Image-9-06-2026-10-55-29.png"
                alt="Secret Fragrance Reflection"
                className="w-80 h-80 sm:w-[500px] sm:h-[500px] object-contain filter brightness-[0.5] sepia-[15%] rounded-full scale-y-[-1]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          {/* 3. LAYER: Elegant Golden Typography Block with premium metallic glow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center z-10 px-4 -mt-4 w-full"
          >
            {/* SECRET with metallic gradient and extra space tracking */}
            <h1 className="font-display text-4.5xl sm:text-6xl font-extrabold tracking-[0.3em] bg-gradient-to-b from-[#ffffff] via-[#f7e8b9] via-[#dbbf64] to-[#7f6111] bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] select-none uppercase font-serif">
              SECRET
            </h1>
            
            {/* — FRAGRANCE — */}
            <h2 className="font-display text-xs sm:text-sm font-semibold tracking-[0.55em] text-[#dbbf64] mt-3 select-none uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              — FRAGRANCE —
            </h2>

            {/* Symmetrical ornament design matching the picture style with animated slow rot */}
            <div className="flex items-center gap-4 my-5 w-full justify-center">
              <div className="h-[0.5px] w-14 sm:w-20 bg-gradient-to-r from-transparent to-[#dbbf64]/50" />
              <motion.svg 
                animate={{ rotate: 135 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-5.5 h-5.5 text-[#dbbf64]/80" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.0"
              >
                <rect x="6" y="6" width="12" height="12" fill="currentColor" fillOpacity="0.15" />
                <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.4" stroke="none" />
              </motion.svg>
              <div className="h-[0.5px] w-14 sm:w-20 bg-gradient-to-l from-transparent to-[#dbbf64]/50" />
            </div>

            {/* Sub-description subtitle */}
            <p className="font-serif italic text-[10px] sm:text-[11.5px] text-[#ebdcb0]/65 tracking-[0.25em] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              AUTHENTIC FRAGRANCES • EXCLUSIVE PRICES
            </p>
          </motion.div>

          {/* 4. LAYER: Slim Loading Progress Bar & Skip Option (At the bottom) */}
          <div className="flex flex-col items-center justify-end pb-[6vh] sm:pb-[8vh] w-full z-10 px-6 gap-6">
            
            {/* Very thin progress bar representing the design */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.7, duration: 1.2 }}
              className="w-full max-w-[240px] sm:max-w-[300px] flex flex-col items-center"
            >
              <div className="w-full h-[2.5px] bg-neutral-900/90 rounded-full overflow-hidden relative shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {/* Active progress */}
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#7c5e13] via-[#dbbf64] to-[#fbf8eb] rounded-full relative"
                  style={{ width: `${progress}%` }}
                />
                
                {/* Glowing loader tip */}
                {progress > 0 && progress < 100 && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#dbbf64]"
                    style={{ left: `calc(${progress}% - 3px)` }}
                  />
                )}
              </div>
            </motion.div>

            {/* Skip Intro button with elegant minimalist format */}
            <motion.button
              id="skip-intro-btn"
              onClick={handleSkip}
              className="flex items-center gap-1.5 text-[9.5px] font-display tracking-[0.25em] text-[#dbbf64]/45 hover:text-[#e8d79c] transition-all uppercase bg-transparent px-3 py-1.5 rounded cursor-pointer border border-[#dbbf64]/5 hover:border-[#dbbf64]/20 hover:bg-[#dbbf64]/5 z-20 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.3, duration: 1 }}
            >
              Skip Intro
              <ArrowRight className="w-3 h-3" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

