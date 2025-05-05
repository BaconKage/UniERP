import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  footer?: ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, title, className = '', footer }) => {
  return (
    <div className={`bg-white rounded-xl shadow-soft overflow-hidden card-hover ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">{footer}</div>
      )}
    </div>
  );
};

export default Card