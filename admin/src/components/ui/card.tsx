import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, footer }) => {
    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
            {title && (
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>
            )}
            <div className="px-6 py-4">{children}</div>
            {footer && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    {footer}
                </div>
            )}
        </div>
    );
};

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
    return (
        <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
            {children}
        </div>
    );
};

interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
    return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
    return (
        <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 ${className}`}>
            {children}
        </div>
    );
};
