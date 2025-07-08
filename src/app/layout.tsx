import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { DataLoader } from '@/app/components/DataLoader'
import DebugPanel from '@/app/components/ui/DebugPanel'

const inter = Inter({ subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Code TREAT',
  description: 'Code LLM Trustworthiness/Reliability Evaluation and Testing',
  keywords: ['Code', 'LLM', 'Testing', 'Evaluation'],
  authors: [{ name: 'Code TREAT Team' }],
  robots: 'index, follow',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Code TREAT',
    description: 'Code LLM Trustworthiness/Reliability Evaluation and Testing',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={jetbrainsMono.variable}>
      <body 
        className={`${inter.className} min-h-screen font-sans antialiased bg-background text-foreground 
        flex flex-col selection:bg-primary/10 selection:text-primary`}
      >
        <DataLoader />
        <DebugPanel />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  )
}
