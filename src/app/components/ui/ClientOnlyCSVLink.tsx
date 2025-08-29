'use client';

import { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';

interface ClientOnlyCSVLinkProps {
  data: Array<Record<string, unknown>>;
  headers: Array<{ label: string; key: string }>;
  filename: string;
  className?: string;
  children: React.ReactNode;
}

export default function ClientOnlyCSVLink({ 
  data, 
  headers, 
  filename, 
  className, 
  children 
}: ClientOnlyCSVLinkProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR or before hydration, render a disabled button
  if (!isClient) {
    return (
      <button 
        className={className}
        disabled
        style={{ opacity: 0.7, cursor: 'not-allowed' }}
      >
        {children}
      </button>
    );
  }

  // After hydration, render the actual CSVLink
  return (
    <CSVLink
      data={data}
      headers={headers}
      filename={filename}
      className={className}
      target="_blank"
    >
      {children}
    </CSVLink>
  );
} 