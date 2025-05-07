declare module 'react-csv' {
  import { ComponentType, ReactNode } from 'react';

  export interface CSVLinkProps {
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