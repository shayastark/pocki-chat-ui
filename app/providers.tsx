'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi-config';
import { PRIVY_APP_ID, PRIVY_BASE_APP_CLIENT_ID } from '@/lib/constants';
import { ReactNode, useState } from 'react';
import { MiniAppProvider, useMiniApp } from '@/app/contexts/MiniAppContext';

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

  const clientId = detectionComplete && isBaseApp && PRIVY_BASE_APP_CLIENT_ID 
    ? PRIVY_BASE_APP_CLIENT_ID 
    : undefined;

  if (detectionComplete && isBaseApp) {
    if (!PRIVY_BASE_APP_CLIENT_ID) {
      console.error('⚠️ Base App detected but NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID is missing!');
    } else {
      console.log('🎯 Using Base App client ID for Privy');
    }
  }

  return (
    <PrivyProvider
      key={clientId || 'default'}
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
    <MiniAppProvider>
      <PrivyWrapper>{children}</PrivyWrapper>
    </MiniAppProvider>
  );
}
