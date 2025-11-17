'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi-config';
import { PRIVY_APP_ID, PRIVY_BASE_APP_CLIENT_ID } from '@/lib/constants';
import { ReactNode, useState, useEffect } from 'react';
import { MiniAppProvider, useMiniApp } from '@/app/contexts/MiniAppContext';
import { ThemeProvider } from '@/app/contexts/ThemeContext';

function PrivyWrapper({ children }: { children: ReactNode }) {
  const { isBaseApp, detectionComplete } = useMiniApp();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  // Initialize Privy immediately - don't wait for detection
  // clientId will be undefined initially, then update if Base App is detected
  // Use a stable key to avoid remounting PrivyProvider unnecessarily
  const clientId = detectionComplete && isBaseApp && PRIVY_BASE_APP_CLIENT_ID 
    ? PRIVY_BASE_APP_CLIENT_ID 
    : undefined;

  // Log for debugging
  useEffect(() => {
    if (!PRIVY_APP_ID) {
      console.error('❌ PRIVY_APP_ID is missing! Privy cannot initialize.');
      console.error('⚠️ Make sure NEXT_PUBLIC_PRIVY_APP_ID is set in Railway environment variables');
    } else {
      console.log('🔧 Privy initialization:', {
        appId: PRIVY_APP_ID,
        hasClientId: !!clientId,
        clientId: clientId || 'using default app',
        detectionComplete,
        isBaseApp,
      });
    }
  }, [clientId, detectionComplete, isBaseApp]);

  if (detectionComplete && isBaseApp) {
    if (!PRIVY_BASE_APP_CLIENT_ID) {
      console.error('⚠️ Base App detected but NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID is missing!');
    } else {
      console.log('🎯 Using Base App client ID for Privy');
    }
  }

  // Prevent crash if PRIVY_APP_ID is missing
  if (!PRIVY_APP_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-6xl text-center mb-4">🐼</div>
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">
            Configuration Error
          </h2>
          <p className="text-gray-600 text-center mb-6">
            PRIVY_APP_ID is missing. Please check your Railway environment variables.
          </p>
          <p className="text-xs text-gray-400 text-center">
            Check the browser console for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      key={clientId ? `base-app-${clientId}` : 'default-app'}
      appId={PRIVY_APP_ID}
      clientId={clientId}
      config={{
        loginMethods: ['farcaster', 'wallet', 'email', 'google', 'twitter'],
        appearance: {
          theme: 'light',
          accentColor: '#16a34a',
          logo: undefined,
          walletList: ['base_account', 'metamask', 'coinbase_wallet', 'rainbow', 'wallet_connect', 'detected_wallets'],
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <MiniAppProvider>
        <PrivyWrapper>{children}</PrivyWrapper>
      </MiniAppProvider>
    </ThemeProvider>
  );
}
