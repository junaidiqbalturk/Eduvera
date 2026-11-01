'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToLogin() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-xs">
      Redirecting to Eduvera Unified Institutional Login...
    </div>
  );
}
