import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'PromptiX CRM',
  description: 'Internal CRM handling Admin and Employee portals',
};

import { Toaster } from 'sonner';
import { CommandMenu } from '@/components/CommandMenu';
import AIAssistant from '@/components/ai/AIAssistant';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
          <CommandMenu />
          <AIAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
