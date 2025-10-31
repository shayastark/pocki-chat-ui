'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function BaseAppBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = async () => {
      const isInMiniApp = await sdk.isInMiniApp();
      
      if (isInMiniApp) {
        setIsVisible(false);
        return;
      }
      
      const dismissed = localStorage.getItem('baseAppBannerDismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };
    
    checkVisibility();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('baseAppBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-panda-green-50 border border-panda-green-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            You can also chat with Pocki in the Base App by messaging{' '}
            <span className="font-semibold text-panda-green-700">pocki.base.eth</span>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
