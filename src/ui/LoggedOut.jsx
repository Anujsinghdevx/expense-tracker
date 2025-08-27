import React from "react";
import { Lock, ShieldCheck, LogIn } from "lucide-react";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.20455c0-.63955-.0573-1.25591-.1636-1.84864H9v3.49545h4.8436c-.2099 1.1318-.8468 2.0909-1.8045 2.7336v2.2736h2.9155c1.7045-1.5718 2.6854-3.8864 2.6854-6.654." fill="#4285F4" />
      <path d="M9 18c2.43 0 4.4699-.8046 5.9591-2.1864l-2.9155-2.2736c-.8046.54-1.8341.8591-3.0436.8591-2.34181 0-4.32455-1.58-5.02909-3.70455H.957275v2.33181C2.43818 15.7273 5.48182 18 9 18z" fill="#34A853" />
      <path d="M3.97091 10.6946A5.40728 5.40728 0 0 1 3.68182 9c0-.58727.10182-1.15818.28909-1.69455V4.97364H.957275A8.99637 8.99637 0 0 0 0 9c0 1.4573.348182 2.8346.957275 4.0264l3.013635-2.3318z" fill="#FBBC05" />
      <path d="M9 3.54545c1.3218 0 2.5118.45455 3.4454 1.34545l2.5864-2.58636C13.4654.882727 11.4264 0 9 0 5.48182 0 2.43818 2.27273.957275 5.0l3.013635 2.33182C4.67545 5.12545 6.65818 3.54545 9 3.54545z" fill="#EA4335" />
    </svg>
  );
}

function TopographyBG() {
  // generates a smooth wavy path (feels like contour/terrace lines)
  const wave = (y, a, phase = 0) => {
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
  };

  const linesA = Array.from({ length: 14 }, (_, i) => 80 + i * 55); // layer A
  const linesB = Array.from({ length: 14 }, (_, i) => 50 + i * 55); // layer B (offset)

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {/* gradient wash for ocean mood */}
        <defs>
          <linearGradient id="oceanWash" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#eff6ff" />
            <stop offset="100%" stopColor="#eef2ff" />
          </linearGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#oceanWash)" />
      </svg>

      {/* Layer A (cyan/blue, slower) */}
      <svg
        className="absolute inset-0 w-[180%] h-[180%] topo-animate-slow"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <g stroke="#06b6d4" strokeOpacity="0.18" fill="none" strokeWidth="1.2">
          {linesA.map((y, i) => (
            <path key={`a-${i}`} d={wave(y, 26, i * 0.05)} />
          ))}
        </g>
      </svg>

      {/* Layer B (indigo/slate, slightly faster, rotated for parallax) */}
      <svg
        className="absolute inset-0 w-[200%] h-[200%] topo-animate"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        style={{ transform: "rotate(2deg)" }}
      >
        <g stroke="#4f46e5" strokeOpacity="0.12" fill="none" strokeWidth="1.1">
          {linesB.map((y, i) => (
            <path key={`b-${i}`} d={wave(y, 34, i * 0.07)} />
          ))}
        </g>
      </svg>

      {/* Subtle vignette for contrast */}
      <div className="absolute inset-0 pointer-events-none"
           style={{
             background:
               "radial-gradient(1200px 600px at 50% 30%, rgba(0,0,0,0.04), transparent 60%)",
           }}
      />
    </div>
  );
}

export default function LoggedOut({ onGoogleLogin }) {
  return (
    <div className="relative min-h-screen">
      <TopographyBG />

      <div className="relative mx-auto flex min-h-svh max-w-7xl items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="rounded-2xl ring-1 ring-blue-100 bg-white/90 backdrop-blur p-5 sm:p-6 shadow-lg">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
                <Lock className="h-6 w-6 text-blue-600" aria-hidden />
              </div>
              <h1 className="text-lg sm:text-2xl text-slate-900 font-bold tracking-tight">
                Please log in
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Secure sign-in to continue to your dashboard
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={onGoogleLogin}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm sm:text-base font-medium text-white transition
                           hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                aria-label="Continue with Google"
              >
                <GoogleIcon />
                <span className="truncate">Continue with Google</span>
                <LogIn className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </button>

              <div className="relative flex items-center">
                <div className="h-px w-full bg-blue-100" />
                <span className="px-3 text-[10px] sm:text-xs text-slate-500 bg-white/90 backdrop-blur relative -top-2">
                  or
                </span>
                <div className="h-px w-full bg-blue-100" />
              </div>

              <div className="flex items-start gap-2 rounded-lg p-3 text-[11px] sm:text-xs bg-white/80 text-slate-600 ring-1 ring-blue-100">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                <p>
                  We use industry-standard encryption. By continuing, you agree to our Terms and Privacy Policy.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] sm:text-xs text-slate-500">
            © {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </div>

      {/* animation CSS (scoped) */}
      <style>{`
        @keyframes topoPanA { 
          0% { transform: translate3d(0,0,0); } 
          100% { transform: translate3d(-220px,-140px,0); } 
        }
        @keyframes topoPanB { 
          0% { transform: translate3d(0,0,0) rotate(2deg); } 
          100% { transform: translate3d(-340px,-220px,0) rotate(2deg); } 
        }
        .topo-animate { 
          animation: topoPanB 60s linear infinite; 
          will-change: transform; 
          opacity: 0.9;
        }
        .topo-animate-slow { 
          animation: topoPanA 110s linear infinite; 
          will-change: transform; 
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}
