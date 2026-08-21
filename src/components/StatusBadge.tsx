import React from 'react';
import { BatchStatus } from '../types/index.ts';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  TagIcon,
  ArchiveBoxXMarkIcon,
} from '@heroicons/react/20/solid';

interface StatusBadgeProps {
  status: BatchStatus;
  daysRemaining?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  daysRemaining,
  showIcon = true,
  size = 'md',
}) => {
  let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let label = 'Safe';
  let Icon = CheckCircleIcon;
  let dotClass = 'bg-emerald-500';

  switch (status) {
    case 'SAFE':
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = daysRemaining !== undefined ? `Safe (${daysRemaining}d)` : 'Safe Stock';
      Icon = CheckCircleIcon;
      dotClass = 'bg-emerald-500';
      break;
    case 'WARNING_30':
      bgClass = 'bg-lime-50 text-lime-900 border-lime-300';
      label = daysRemaining !== undefined ? `Warning (${daysRemaining}d)` : '30d Warning';
      Icon = ExclamationTriangleIcon;
      dotClass = 'bg-lime-600';
      break;
    case 'WARNING_14':
      bgClass = 'bg-amber-50 text-amber-900 border-amber-300';
      label = daysRemaining !== undefined ? `Alert (${daysRemaining}d)` : '14d Alert';
      Icon = ExclamationTriangleIcon;
      dotClass = 'bg-amber-500';
      break;
    case 'CRITICAL_7':
      bgClass = 'bg-rose-50 text-rose-900 border-rose-300 animate-pulse';
      label = daysRemaining !== undefined ? `Critical (${daysRemaining}d)` : 'Critical (<=7d)';
      Icon = ExclamationCircleIcon;
      dotClass = 'bg-rose-600';
      break;
    case 'EXPIRED':
      bgClass = 'bg-red-100 text-red-950 border-red-400 font-semibold';
      label = daysRemaining !== undefined ? `Expired (${Math.abs(daysRemaining)}d ago)` : 'Expired';
      Icon = XCircleIcon;
      dotClass = 'bg-red-700';
      break;
    case 'DISCOUNTED':
      bgClass = 'bg-emerald-100 text-emerald-950 border-emerald-300';
      label = 'Clearance Tagged';
      Icon = TagIcon;
      dotClass = 'bg-emerald-600';
      break;
    case 'DISPOSED':
      bgClass = 'bg-slate-100 text-slate-700 border-slate-300';
      label = 'Disposed / Written Off';
      Icon = ArchiveBoxXMarkIcon;
      dotClass = 'bg-slate-500';
      break;
    default:
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${bgClass} ${sizeClasses[size]} whitespace-nowrap shadow-xs`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} aria-hidden="true" />}
      {!showIcon && <span className={`w-1.5 h-1.5 rounded-full ${dotClass} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
};
