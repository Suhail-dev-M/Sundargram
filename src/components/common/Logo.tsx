import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl sm:text-5xl',
  };

  return (
    <div className={`font-logo select-none tracking-normal ${sizeClasses[size]} ${className}`}>
      <span className="text-[#262626] dark:text-[#FAFAFA] hover:opacity-90 transition-opacity">
        Sundargram
      </span>
    </div>
  );
};
