import React, { useCallback, useMemo, useState } from "react";
import { Lock, ShieldCheck, LogIn, IndianRupeeIcon } from "lucide-react";

/** WCAG-compliant Google "G" (inline, no extra libs) */
function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.20455c0-.63955-.0573-1.25591-.1636-1.84864H9v3.49545h4.8436c-.2099 1.1318-.8468 2.0909-1.8045 2.7336v2.2736h2.9155c1.7045-1.5718 2.6854-3.8864 2.6854-6.654z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4699-.8046 5.9591-2.1864l-2.9155-2.2736c-.8046.54-1.8341.8591-3.0436.8591-2.34181 0-4.32455-1.58-5.02909-3.70455H.957v2.33181C2.438 15.7273 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.971 10.6946A5.407 5.407 0 0 1 3.682 9c0-.58727.10182-1.15818.28909-1.69455V4.97364H.957A8.996 8.996 0 0 0 0 9c0 1.4573.348 2.8346.957 4.0264l3.014-2.3318z" fill="#FBBC05"/>
      <path d="M9 3.54545c1.3218 0 2.5118.45455 3.4454 1.34545l2.5864-2.58636C13.4654.882727 11.4264 0 9 0 5.482 0 2.438 2.27273.957 5.0l3.014 2.33182C4.675 5.12545 6.658 3.54545 9 3.54545z" fill="#EA4335"/>
    </svg>
  );
}

/** Soft, light-only topographic background */
function TopographyBG() {
  const wave = useCallback((y, a, phase = 0) => {
    const seg = 8;
    const w = 1600;
    const step = w / seg;
    let d = `M 0 ${y}`;
    for (let i = 1; i <= seg; i++) {
      const x = i * step;
      const cx1 = x - step * 0.66;
      const cx2 = x - step * 0.33;
      const t1 = (i - 1) / seg + phase;
      const t2 = i / seg + phase;
      const y1 = y + Math.sin(t1 * Math.PI * 2) * a;
      const y2 = y + Math.sin(t2 * Math.PI * 2) * a;
      d += ` C ${cx1} ${y1}, ${cx2} ${y2}, ${x} ${y2}`;
    }
    return d;
  }, []);

  const linesA = useMemo(() => Array.from({ length: 14 }, (_, i) => 80 + i * 55), []);
  const linesB = useMemo(() => Array.from({ length: 14 }, (_, i) => 50 + i * 55), []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="oceanWash" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f8fbff" />
            <stop offset="100%" stopColor="#eef2ff" />
          </linearGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#oceanWash)" />
      </svg>

      <svg className="absolute inset-0 w-[180%] h-[180%] topo-animate-slow" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g stroke="#06b6d4" strokeOpacity="0.16" fill="none" strokeWidth="1.1">
          {linesA.map((y, i) => <path key={`a-${i}`} d={wave(y, 26, i * 0.05)} />)}
        </g>
      </svg>

      <svg className="absolute inset-0 w-[200%] h-[200%] topo-animate" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g stroke="#6366f1" strokeOpacity="0.10" fill="none" strokeWidth="1.0">
          {linesB.map((y, i) => <path key={`b-${i}`} d={wave(y, 34, i * 0.07)} />)}
        </g>
      </svg>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(1200px 600px at 50% 28%, rgba(2,6,23,0.05), transparent 60%)" }}
      />
      <div
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-40"
        style={{ background: "conic-gradient(from 180deg, #dbeafe, #e0e7ff, #ccfbf1, #e0e7ff)" }}
        aria-hidden
      />
    </div>
  );
}

/**
 * @param {{ onGoogleLogin: () => Promise<void> | void }} props
 */
export default function LoggedOut({ onGoogleLogin }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.resolve(onGoogleLogin?.());
    } finally {
      setLoading(false);
    }
  }, [onGoogleLogin]);

  return (
    <div className="relative min-h-screen bg-white text-slate-900">
      <TopographyBG />

      <header className="relative z-10 mx-auto max-w-7xl px-4 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl grid place-items-center bg-blue-50 ring-1 ring-blue-100">
            <IndianRupeeIcon className="h-5 w-5 text-blue-600" aria-hidden />
          </div>
          <span className="font-semibold tracking-tight">Expense Tracker</span>
        </div>
       
      </header>

      <main className="relative z-10 mx-auto flex min-h-[70svh] max-w-7xl items-center justify-center px-4 pb-12">
        <section className="w-full max-w-sm sm:max-w-md">
          <div className="rounded-2xl ring-1 ring-blue-100/80 bg-white/90 backdrop-blur p-5 sm:p-6 shadow-lg">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
                <Lock className="h-6 w-6 text-blue-600" aria-hidden />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Sign in to continue</h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Your data is encrypted at rest and in transit.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className={`group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm sm:text-base font-medium text-white transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98]
                ${loading ? "bg-blue-500 cursor-wait" : "bg-blue-600 hover:bg-blue-700"}
                `}
                aria-label="Continue with Google"
              >
                {loading ? (
                  <span className="relative flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden />
                    <span>Connecting…</span>
                  </span>
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="truncate">Continue with Google</span>
                    <LogIn className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </>
                )}
              </button>

              <div className="relative flex items-center" aria-hidden>
                <div className="h-px w-full bg-blue-100" />
                <span className="px-3 text-[10px] sm:text-xs text-slate-500 bg-white/90 backdrop-blur relative -top-2">
                  or
                </span>
                <div className="h-px w-full bg-blue-100" />
              </div>

              <div className="flex items-start gap-2 rounded-lg p-3 text-[11px] sm:text-xs bg-white/85 text-slate-700 ring-1 ring-blue-100">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                <p>
                  By continuing, you agree to our <a href="#terms" className="underline decoration-blue-300 hover:text-slate-900">Terms</a> and <a href="#privacy" className="underline decoration-blue-300 hover:text-slate-900">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] sm:text-xs text-slate-500">
            © {new Date().getFullYear()} • All rights reserved.
          </p>
        </section>
      </main>

      {/* Scoped animation & a11y */}
      <style>{`
        @keyframes topoPanA { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(-220px,-140px,0); } }
        @keyframes topoPanB { 0% { transform: translate3d(0,0,0) rotate(2deg); } 100% { transform: translate3d(-340px,-220px,0) rotate(2deg); } }
        .topo-animate { animation: topoPanB 60s linear infinite; will-change: transform; opacity: 0.9; }
        .topo-animate-slow { animation: topoPanA 110s linear infinite; will-change: transform; opacity: 0.85; }

        @media (prefers-reduced-motion: reduce) {
          .topo-animate, .topo-animate-slow { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
