import type { Metadata } from 'next';
import './globals.css';
import { Suspense } from 'react';
import SessionProvider from '@/components/SessionProvider';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Internal Knowledge Base',
  description: 'Shared place for storing files and sharing knowledge.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <SessionProvider>
          <div className="flex flex-col md:flex-row min-h-screen">
            <Suspense fallback={null}><Sidebar /></Suspense>
            <main className="flex-1 min-w-0 bg-background flex flex-col">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
