import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`border border-[var(--border)] bg-[var(--card)] rounded-xl p-3.5 ${className}`}
    >
      {children}
    </div>
  );
}
