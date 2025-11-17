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
