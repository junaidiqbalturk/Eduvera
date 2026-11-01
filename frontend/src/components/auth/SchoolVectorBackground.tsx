'use client';

import React from 'react';

/**
 * Clean, Minimalist Ambient Background
 * Powered by a subtle looping background GIF in cool-toned gradients (slate, sky, blue, indigo)
 * that perfectly complements the light theme of the application.
 */
export const AuthBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    style={{ contain: 'strict', contentVisibility: 'auto' }}
  >
    {/* Base subtle cool slate-50 canvas matching the main dashboard */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-sky-50/60 to-blue-50/50" />

    {/* Ambient Looping GIF Background with isolated hardware alpha blending */}
    <img
      src="/images/auth-bg.gif"
      alt="Ambient Background Animation"
      className="absolute inset-0 w-full h-full object-cover opacity-[0.16] pointer-events-none select-none"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
      }}
    />

    {/* High-performance pure CSS radial lighting gradients without heavy blur filters */}
    <div
      className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle, rgba(186, 230, 253, 0.45) 0%, rgba(186, 230, 253, 0) 70%)',
      }}
    />
    <div
      className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle, rgba(191, 219, 254, 0.4) 0%, rgba(191, 219, 254, 0) 70%)',
      }}
    />

    {/* Soft subtle dot matrix */}
    <div
      className="absolute inset-0 opacity-[0.12] pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.3) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  </div>
);

// Backward compatibility aliases
export const InstitutionalBackground = AuthBackground;
export const SchoolPatternSvg = AuthBackground;
export const FloatingAcademicBadges = () => null;
export const SchoolHeroIllustration = () => null;
export const ExecutiveInstitutionalShowcase = () => null;
