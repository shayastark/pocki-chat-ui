import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pocki Chat - Mindful AI Trading Companion',
  description: 'Your mindful AI onchain wallet companion that helps you set alerts, journal trades, and pause before acting on impulse.',
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://pocki-chat.replit.app/images/pocki-wide.png',
      button: {
        title: 'Chat with Pocki',
        action: {
          type: 'launch_frame',
          name: 'Pocki',
          url: 'https://pocki-chat.replit.app',
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
