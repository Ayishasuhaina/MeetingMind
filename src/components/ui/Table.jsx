import React from 'react';

export default function Table({ headers, children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                onClick={header.onClick}
                style={header.onClick ? { cursor: 'pointer' } : {}}
              >
                <span className="flex items-center gap-1">
                  {header.label}
                  {header.sortIcon && <span>{header.sortIcon}</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {children}
        </tbody>
      </table>
    </div>
  );
}
