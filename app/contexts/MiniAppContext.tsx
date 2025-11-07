'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import miniappSdk from '@farcaster/miniapp-sdk';

interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  followerCount?: number;
  followingCount?: number;
  powerBadge?: boolean;
}

interface MiniAppContextType {
  isMiniApp: boolean;
  isBaseApp: boolean;
  isFarcaster: boolean;
  detectionComplete: boolean;
  farcasterProfile: FarcasterProfile | null;
  setFarcasterProfile: (profile: FarcasterProfile | null) => void;
}

const MiniAppContext = createContext<MiniAppContextType>({
  isMiniApp: false,
  isBaseApp: false,
  isFarcaster: false,
  detectionComplete: false,
  farcasterProfile: null,
  setFarcasterProfile: () => {},
});

export function useMiniApp() {
  return useContext(MiniAppContext);
}

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<MiniAppContextType, 'setFarcasterProfile'>>({
    isMiniApp: false,
    isBaseApp: false,
    isFarcaster: false,
    detectionComplete: false,
    farcasterProfile: null,
  });

  const setFarcasterProfile = (profile: FarcasterProfile | null) => {
    setState(prev => ({ ...prev, farcasterProfile: profile }));
  };

  useEffect(() => {
    const detectMiniApp = async () => {
      try {
        const inMiniApp = await miniappSdk.isInMiniApp();
        
        if (inMiniApp) {
          const context = await miniappSdk.context;
          const clientFid = context?.client?.clientFid;
          const isBase = clientFid === 309857;
          const isFc = clientFid === 9152;
          
          setState(prev => ({
            ...prev,
            isMiniApp: true,
            isBaseApp: isBase,
            isFarcaster: isFc,
            detectionComplete: true,
          }));
          
          console.log('🔍 Mini App detected:', {
            inMiniApp: true,
            clientFid,
            platformType: context?.client?.platformType,
            isBaseApp: isBase,
            isFarcaster: isFc,
          });
        } else {
          setState(prev => ({
            ...prev,
            isMiniApp: false,
            isBaseApp: false,
            isFarcaster: false,
            detectionComplete: true,
          }));
          console.log('🔍 Not in Mini App environment (browser mode)');
        }
      } catch (error) {
        console.log('🔍 Mini App detection error:', error);
        setState(prev => ({
          ...prev,
          isMiniApp: false,
          isBaseApp: false,
          isFarcaster: false,
          detectionComplete: true,
        }));
      }
    };
    
    detectMiniApp();
  }, []);

  return (
    <MiniAppContext.Provider value={{ ...state, setFarcasterProfile }}>
      {children}
    </MiniAppContext.Provider>
  );
}
