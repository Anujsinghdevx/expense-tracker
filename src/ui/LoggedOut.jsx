import React from "react";
import { Lock, ShieldCheck, LogIn } from "lucide-react";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.20455c0-.63955-.0573-1.25591-.1636-1.84864H9v3.49545h4.8436c-.2099 1.1318-.8468 2.0909-1.8045 2.7336v2.2736h2.9155c1.7045-1.5718 2.6854-3.8864 2.6854-6.654." fill="#4285F4" />
      <path d="M9 18c2.43 0 4.4699-.8046 5.9591-2.1864l-2.9155-2.2736c-.8046.54-1.8341.8591-3.0436.8591-2.34181 0-4.32455-1.58-5.02909-3.70455H.957275v2.33181C2.43818 15.7273 5.48182 18 9 18z" fill="#34A853" />
      <path d="M3.97091 10.6946A5.40728 5.40728 0 0 1 3.68182 9c0-.58727.10182-1.15818.28909-1.69455V4.97364H.957275A8.99637 8.99637 0 0 0 0 9c0 1.4573.348182 2.8346.957275 4.0264l3.013635-2.3318z" fill="#FBBC05" />
      <path d="M9 3.54545c1.3218 0 2.5118.45455 3.4454 1.34545l2.5864-2.58636C13.4654.882727 11.4264 0 9 0 5.48182 0 2.43818 2.27273.957275 5.0l3.013635 2.33182C4.67545 5.12545 6.65818 3.54545 9 3.54545z" fill="#EA4335" />
    </svg>
  );
}

export default function LoggedOut({ onGoogleLogin }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl ring-1 ring-gray-200 bg-white p-6 shadow-sm">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 ring-1 ring-gray-200">
                <Lock className="h-6 w-6 text-gray-500" aria-hidden />
              </div>
              <h1 className="text-2xl text-gray-900 font-semibold tracking-tight">Please log in</h1>
              <p className="text-sm text-gray-600">Secure sign-in to continue to your dashboard</p>
            </div>
            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={onGoogleLogin}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-base font-medium text-white transition-[background,transform] hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                aria-label="Continue with Google"
              >
                <GoogleIcon />
                Continue with Google
                <LogIn className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </button>

              <div className="relative flex items-center">
                <div className="h-px w-full bg-gray-200" />
                <span className="px-3 text-xs text-gray-500 bg-white relative -top-2">or</span>
                <div className="h-px w-full bg-gray-200" />
              </div>

              <div className="flex items-start gap-2 rounded-lg p-3 text-xs bg-gray-50 text-gray-600 ring-1 ring-gray-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                <p>We use industry-standard encryption. By continuing, you agree to our Terms and Privacy Policy.</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">© {new Date().getFullYear()}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}