import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface LiquidGlassToastProps {
  message: string | null;
  onClose?: () => void;
  type?: 'success' | 'warning' | 'info';
}

export const LiquidGlassToast: React.FC<LiquidGlassToastProps> = ({
  message,
  onClose,
  type = 'success',
}) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.88, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -16, scale: 0.92, filter: 'blur(8px)' }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 28,
            mass: 0.8,
          }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-[92vw] sm:max-w-md w-auto"
        >
          {/* Apple Liquid Glass Capsule Container */}
          <div
            className="relative group overflow-hidden rounded-full px-4 py-2.5 sm:px-5 sm:py-3 
              bg-stone-900/65 backdrop-blur-2xl backdrop-saturate-200 
              border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.3)_inset]
              flex items-center gap-3 text-white transition-all duration-300 hover:bg-stone-900/75 hover:border-white/30"
            style={{
              boxShadow:
                '0 12px 36px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15) inset, 0 1px 2px 0 rgba(255, 255, 255, 0.25) inset',
            }}
          >
            {/* Liquid Light Specular Sheen (top gradient reflection) */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[45%] pointer-events-none rounded-t-full 
                bg-gradient-to-b from-white/25 via-white/5 to-transparent"
            />

            {/* Glowing Accent Ambient Orb */}
            <div
              aria-hidden="true"
              className={`absolute -left-4 -top-4 w-14 h-14 rounded-full blur-xl pointer-events-none opacity-60 ${
                type === 'warning'
                  ? 'bg-amber-400'
                  : type === 'info'
                  ? 'bg-sky-400'
                  : 'bg-emerald-400'
              }`}
            />

            {/* Status Icon */}
            <div className="relative shrink-0 flex items-center justify-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center 
                  bg-white/10 backdrop-blur-md border border-white/20 shadow-xs ${
                    type === 'warning'
                      ? 'text-amber-300'
                      : type === 'info'
                      ? 'text-sky-300'
                      : 'text-emerald-300'
                  }`}
              >
                {type === 'warning' ? (
                  <ExclamationCircleIcon className="w-4 h-4" />
                ) : type === 'info' ? (
                  <InformationCircleIcon className="w-4 h-4" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Message Text */}
            <div className="relative text-xs sm:text-sm font-medium tracking-tight text-white/95 leading-snug select-none pr-1">
              {message}
            </div>

            {/* Dismiss Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="relative shrink-0 w-5 h-5 rounded-full flex items-center justify-center 
                  text-white/50 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
