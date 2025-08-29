declare module 'react-csv' {
  import { ComponentType, ReactNode } from 'react';

  export interface CSVLinkProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Array<any>;
    headers?: Array<{ label: string; key: string }>;
    target?: string;
    separator?: string;
    filename?: string;
    uFEFF?: boolean;
    onClick?: () => void;
    className?: string;
    children?: ReactNode;
  }

  export const CSVLink: ComponentType<CSVLinkProps>;

  export interface CSVDownloadProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Array<any>;
    headers?: Array<{ label: string; key: string }>;
    target?: string;
    separator?: string;
    filename?: string;
    uFEFF?: boolean;
    onClick?: () => void;
  }

  export const CSVDownload: ComponentType<CSVDownloadProps>;
} 