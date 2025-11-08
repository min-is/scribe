'use client';

import { HTMLAttributes } from 'react';

// Simplified debug component - baseline grid functionality removed
export default function DivDebugBaselineGrid({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={className}
    >
      {children}
    </div>
  );
}
