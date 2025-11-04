'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import miniappSdk from '@farcaster/miniapp-sdk';

interface MiniAppContextType {
  isMiniApp: boolean;
  isBaseApp: boolean;
  isFarcaster: boolean;
  detectionComplete: boolean;
}

const MiniAppContext = createContext<MiniAppContextType>({
  isMiniApp: false,
  isBaseApp: false,
  isFarcaster: false,
  detectionComplete: false,
});

export function useMiniApp() {
  return useContext(MiniAppContext);
}

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MiniAppContextType>({
    isMiniApp: false,
    isBaseApp: false,
    isFarcaster: false,
    detectionComplete: false,
  });

  useEffect(() => {
    const detectMiniApp = async () => {
      try {
        const inMiniApp = await miniappSdk.isInMiniApp();
        
        if (inMiniApp) {
          const context = await miniappSdk.context;
          const clientFid = context?.client?.clientFid;
          const isBase = clientFid === 309857;
          const isFc = clientFid === 9152;
          
          setState({
            isMiniApp: true,
            isBaseApp: isBase,
            isFarcaster: isFc,
            detectionComplete: true,
          });
          
          console.log('🔍 Mini App detected:', {
            inMiniApp: true,
            clientFid,
            platformType: context?.client?.platformType,
            isBaseApp: isBase,
            isFarcaster: isFc,
          });
        } else {
          setState({
            isMiniApp: false,
            isBaseApp: false,
            isFarcaster: false,
            detectionComplete: true,
          });
          console.log('🔍 Not in Mini App environment (browser mode)');
        }
      } catch (error) {
        console.log('🔍 Mini App detection error:', error);
        setState({
          isMiniApp: false,
          isBaseApp: false,
          isFarcaster: false,
          detectionComplete: true,
        });
      }
    };
    
    detectMiniApp();
  }, []);

  return (
    <MiniAppContext.Provider value={state}>
      {children}
    </MiniAppContext.Provider>
  );
}
