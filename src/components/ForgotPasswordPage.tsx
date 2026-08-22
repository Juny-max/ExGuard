import React, { useState } from 'react';
import { ExpiryGuardLogo } from './ExpiryGuardLogo.tsx';
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onBackToLogin,
  defaultEmail = '',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white p-2 shadow-md border border-emerald-100 ring-4 ring-emerald-50 mb-3">
            <ExpiryGuardLogo className="w-full h-full" variant="original" />
          </div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight">ExpiryGuard</h1>
          <p className="text-sm text-gray-500 mt-1">Supermarket & Mall Expiry System</p>
        </div>

        {/* Off-White Form Card */}
        <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          {!isSubmitted ? (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-gray-900">Reset your password</h2>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Enter your registered work email and we will send you secure password reset instructions and an authorization token.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="reset-email-input">
                    Work Email address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id="reset-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-gray-900 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 placeholder-gray-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Send Instructions Button */}
                <button
                  id="submit-reset-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Sending reset link...</span>
                    </span>
                  ) : (
                    <>
                      <span>Send Reset Instructions</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircleIcon className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">Check your email</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  We sent a recovery link to <span className="font-semibold text-gray-800">{email}</span>. Please check your inbox and spam folders.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                >
                  Didn't receive an email? Click to resend
                </button>
              </div>
            </div>
          )}

          {/* Back to sign in link */}
          <div className="mt-6 pt-5 border-t border-stone-200 text-center">
            <button
              id="back-to-login-btn"
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-semibold cursor-pointer transition-colors"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>

        {/* Subtle Footer Note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Protected by enterprise security &bull; ExpiryGuard Systems
        </p>
      </div>
    </div>
  );
};
