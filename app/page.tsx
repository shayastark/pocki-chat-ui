'use client';

import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useLoginToMiniApp } from '@privy-io/react-auth/farcaster';
import Image from 'next/image';
import { sdk } from '@farcaster/miniapp-sdk';
import { XMTPProvider, useXMTP } from '@/hooks/useXMTP';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { TransactionModal } from '@/components/TransactionModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BaseAppChat } from '@/components/BaseAppChat';
import { UserHeader } from '@/components/UserHeader';
import { useMiniApp } from '@/app/contexts/MiniAppContext';
import miniappSdk from '@farcaster/miniapp-sdk';
import { AGENT_WALLET_ADDRESS } from '@/lib/constants';

// Example messages for rotating display
const EXAMPLE_MESSAGES = [
  "What tokens are trending on Base?",
  "What is the most traded token today?",
  "Analyze my portfolio",
    "What's in the wallet of FID 8637?",
  "Let me know when $ZORA dips 15%",
  "Set a cooldown period of 6 hours",
  "What are top traders buying?",
  "What NFTs are trending on Base?",
  "Who in my network owns $jesse?",
  "buy 50 bucks of AVNT",
  "Swap 1 ETH for USDC",
  "What's trending on Arbitrum?",
  "What's trending on Monad?",
  "What's trending on World Chain?",
];

// Chat component when authenticated
function ChatContent({ isInMiniApp }: { isInMiniApp: boolean }) {
  const { logout, authenticated, ready, user } = usePrivy();
  const { isBaseApp, setFarcasterProfile } = useMiniApp();
  
  // Track the FID separately to prevent multiple fetches
  const [fetchedFid, setFetchedFid] = useState<number | null>(null);
  
  // Fetch Farcaster profile when user authenticates with Farcaster
  useEffect(() => {
    const fetchFarcasterProfile = async () => {
      // Check if user authenticated with Farcaster
      const farcasterAccount = user?.linkedAccounts?.find(
        (account) => account.type === 'farcaster'
      );
      
      if (farcasterAccount && 'fid' in farcasterAccount) {
        const fid = farcasterAccount.fid;
        
        // Only fetch if we haven't fetched this FID already
        if (fid !== fetchedFid) {
          console.log('🎯 Farcaster user detected, fetching profile for FID:', fid);
          
          try {
            const response = await fetch(`/api/farcaster/profile?fid=${fid}`);
            if (response.ok) {
              const profile = await response.json();
              console.log('✅ Fetched Farcaster profile:', profile);
              setFarcasterProfile(profile);
              setFetchedFid(fid); // Mark this FID as fetched
            } else {
              console.error('Failed to fetch Farcaster profile:', response.status);
            }
          } catch (error) {
            console.error('Error fetching Farcaster profile:', error);
          }
        }
      }
    };
    
    if (authenticated && user) {
      fetchFarcasterProfile();
    }
  }, [authenticated, user, setFarcasterProfile, fetchedFid]);
  
  // IMPORTANT: If user is in Base App, skip XMTP initialization entirely
  // and show the BaseAppChat redirect component immediately
  if (isBaseApp) {
    console.log('🎯 Base App detected - showing native messaging redirect (skipping XMTP init)');
    return <BaseAppChat />;
  }
  
  // For non-Base App users, proceed with XMTP initialization
  const { isConnected, isConnecting, error, activeWalletAddress } = useXMTP();
  const [showTxModal, setShowTxModal] = useState(false);
  const [currentTx, setCurrentTx] = useState(null);


  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mb-4 animate-pulse-gentle">
            <Image 
              src="/pocki-logo.jpg" 
              alt="Pocki" 
              width={150} 
              height={150}
              className="mx-auto rounded-2xl"
            />
          </div>
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Connecting to XMTP...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">🎋 Setting up secure messaging</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Note: Base App users never reach this point because they're redirected earlier
    // This error handling is only for browser/Farcaster users
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="flex justify-center mb-4">
            <Image 
              src="/pocki-logo.jpg" 
              alt="Pocki" 
              width={120} 
              height={120}
              className="rounded-2xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
            Connection Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6 whitespace-pre-line">{error}</p>
          
          {/* Show key management for all XMTP errors */}
          {error.includes('installation limit') || error.includes('10/10 installations') || error.includes('hexadecimal') || error.includes('SQLSTATE') ? (
            <div className="space-y-3 mb-4">
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
                <p className="font-semibold text-yellow-800 mb-2">
                  {error.includes('hexadecimal') || error.includes('SQLSTATE') 
                    ? '🔧 Corrupted Installation Key' 
                    : '🔧 Installation Limit Reached'}
                </p>
                <p className="text-yellow-700 text-xs mb-2">
                  {error.includes('hexadecimal') || error.includes('SQLSTATE')
                    ? 'Your stored installation key is corrupted. This causes database errors when connecting to XMTP.'
                    : 'You have 10 installations registered on the XMTP network. This limit is stored server-side.'}
                </p>
                <p className="text-yellow-700 text-xs">
                  Use our utility tool to automatically detect and clear corrupted keys.
                </p>
              </div>
              <button
                onClick={() => {
                  window.location.href = '/clear-xmtp-keys.html';
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🔧 Clear XMTP Keys (Recommended)
              </button>
              <button
                onClick={() => {
                  window.location.href = '/fix-installation-limit.html';
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                📋 Installation Limit Fixer
              </button>
            </div>
          ) : null}
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-panda-green-600 hover:bg-panda-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image 
                src="/pocki-logo.jpg" 
                alt="Pocki" 
                width={40} 
                height={40}
                className="rounded-lg sm:w-12 sm:h-12"
              />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100">Pocki Chat</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Mindful AI Trading Companion</p>
              </div>
            </div>
            {activeWalletAddress && (
              <UserHeader address={activeWalletAddress} onLogout={logout} />
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-4 h-[calc(100vh-80px)]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-full flex flex-col overflow-hidden">
          <MessageList onTransactionRequest={(tx) => {
            console.log('Transaction requested:', tx);
            setCurrentTx(tx);
            setShowTxModal(true);
          }} />
          <MessageInput />
        </div>
      </div>

      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        transaction={currentTx}
      />
    </div>
  );
}

// Landing page component when not authenticated
function LandingPage({ onEnterChat }: { onEnterChat?: () => void }) {
  const { login, authenticated, ready } = usePrivy();
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();
  const { isMiniApp, isBaseApp, detectionComplete } = useMiniApp();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isMessageVisible, setIsMessageVisible] = useState(true);

  // Rotating messages effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsMessageVisible(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % EXAMPLE_MESSAGES.length);
        setIsMessageVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-login for Mini Apps ONLY - gated on detection being complete
  useEffect(() => {
    // Wait for: Privy ready, detection complete, not already authenticated, is a Mini App, haven't tried yet
    if (ready && detectionComplete && !authenticated && isMiniApp && !loginAttempted) {
      const loginMiniApp = async () => {
        try {
          setLoginAttempted(true);
          
          if (isBaseApp) {
            console.log('🎯 Base App auto-login starting (using Base App client ID)');
          } else {
            console.log('🎯 Farcaster Mini App auto-login starting');
          }
          
          const { nonce } = await initLoginToMiniApp();
          console.log('✅ Got nonce from Privy');
          
          const result = await miniappSdk.actions.signIn({ nonce });
          console.log('✅ Got signature from Mini App');
          
          await loginToMiniApp({
            message: result.message,
            signature: result.signature,
          });
          console.log('✅ Logged in with Privy via Mini App!');
        } catch (error) {
          console.error('❌ Mini App login failed:', error);
        }
      };
      
      loginMiniApp();
    }
  }, [ready, detectionComplete, authenticated, isMiniApp, isBaseApp, loginAttempted, initLoginToMiniApp, loginToMiniApp]);

  // Ensure Mini App SDK is ready
  useEffect(() => {
    if (miniappSdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      miniappSdk.actions.ready();
      console.log('🎯 Mini App SDK initialized and ready');
    }
  }, [isSDKLoaded]);

  useEffect(() => {
    console.log('Privy state:', { ready, authenticated });
  }, [ready, authenticated]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse-gentle">
            <Image 
              src="/pocki-logo.jpg" 
              alt="Pocki" 
              width={120} 
              height={120}
              className="mx-auto rounded-2xl"
            />
          </div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-4 flex justify-center">
            <Image 
              src="/pocki-logo.jpg" 
              alt="Pocki" 
              width={200} 
              height={200}
              className="rounded-3xl shadow-lg"
              priority
            />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Your co-pilot for onchain moves
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 mb-8 animate-slide-up">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100 px-2">
            Trading on Impulse? Trade Mindfully Instead.
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div className="text-gray-900 dark:text-gray-100 text-center">
              <p className="mb-3">Pocki helps you:</p>
              <ul className="list-disc list-inside space-y-2 mb-4 text-left inline-block text-sm sm:text-base">
                <li>Follow your strategy</li>
                <li>Gain insight into wallets, tokens, and sentiment</li>
                <li>Set guardrails before you need them</li>
                <li>Monitor portfolio health proactively</li>
              </ul>
            </div>
          </div>

          {/* Ask Pocki rotating messages section */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-panda-green-600 dark:text-panda-green-400 font-serif italic text-2xl sm:text-3xl md:text-4xl text-center mb-4 sm:mb-6 font-medium px-2">
              Ask Pocki
            </h3>
            <div className="relative min-h-[60px] sm:min-h-[80px] flex items-center justify-center px-4">
              <p
                key={currentMessageIndex}
                className={`text-center text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 font-medium transition-all duration-500 ${
                  isMessageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                &quot;{EXAMPLE_MESSAGES[currentMessageIndex]}&quot;
              </p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          {!authenticated ? (
            <>
              <button
                onClick={login}
                className="bg-panda-green-600 hover:bg-panda-green-700 text-white text-lg font-semibold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Connect Wallet to Start 🎋
              </button>
              <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
                Pocki only handles transactions you approve and cannot transfer funds out of any connected wallet.
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  // For Base App users, directly open DM with Pocki
                  if (isBaseApp) {
                    console.log('🎯 Base App user - opening direct message with Pocki');
                    const messagingDeeplink = `cbwallet://messaging/${AGENT_WALLET_ADDRESS}`;
                    window.location.href = messagingDeeplink;
                  } else {
                    // For non-Base App users, proceed to chat interface
                    onEnterChat?.();
                  }
                }}
                className="bg-panda-green-600 hover:bg-panda-green-700 text-white text-lg font-semibold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Enter Chat 💬
              </button>
            </>
          )}
        </div>

        {/* Bottom Logos - Base and XMTP */}
        <div className="mt-12 flex items-center justify-between opacity-80 dark:opacity-60">
          <Image 
            src="/base-logo.png" 
            alt="Base" 
            width={120} 
            height={40}
          />
          <Image 
            src="/xmtp-logo.png" 
            alt="XMTP" 
            width={120} 
            height={40}
          />
        </div>
      </div>
    </div>
  );
}

// Main page component - shows landing or chat based on authentication
export default function HomePage() {
  const { authenticated, ready } = usePrivy();
  const { isMiniApp, detectionComplete } = useMiniApp();
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [hasEnteredChat, setHasEnteredChat] = useState(false);
  const [privyTimeout, setPrivyTimeout] = useState(false);

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        await sdk.actions.ready();
        console.log('✅ Called sdk.actions.ready()');
        
        const miniAppStatus = await sdk.isInMiniApp();
        setIsInMiniApp(miniAppStatus);
        console.log(miniAppStatus ? '🎯 Running as Farcaster/Base App Mini App' : '🌐 Running as standalone web app');
      } catch (error) {
        console.error('Mini App initialization error:', error);
      }
    };

    initializeMiniApp();
  }, []);

  // Debug Privy ready state
  useEffect(() => {
    console.log('🔍 Privy state:', { ready, authenticated });
    
    // Set timeout warning if Privy doesn't become ready within 10 seconds
    const timeout = setTimeout(() => {
      if (!ready) {
        console.error('⚠️ Privy ready state timeout - Privy has not initialized after 10 seconds');
        console.error('Check browser console for CSP violations or network errors');
        setPrivyTimeout(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [ready, authenticated]);

  // Auto-enter chat for browser users (not Mini Apps) after wallet connection
  useEffect(() => {
    // Only auto-enter if:
    // - Privy is ready
    // - User is authenticated
    // - Detection is complete (we know if we're in Mini App or not)
    // - NOT in Mini App (browser users only)
    // - Hasn't already entered chat
    if (ready && authenticated && detectionComplete && !isMiniApp && !hasEnteredChat) {
      console.log('🌐 Browser user authenticated - auto-entering chat');
      setHasEnteredChat(true);
    }
  }, [ready, authenticated, detectionComplete, isMiniApp, hasEnteredChat]);

  // Show loading while checking authentication
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mb-4 animate-pulse-gentle">
            <Image 
              src="/pocki-logo.jpg" 
              alt="Pocki" 
              width={120} 
              height={120}
              className="mx-auto rounded-2xl"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          {privyTimeout && (
            <p className="text-sm text-red-500 mt-2">
              Taking longer than expected. Check browser console for errors.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show chat only if authenticated AND user has explicitly entered chat
  if (authenticated && hasEnteredChat) {
    return (
      <XMTPProvider>
        <ChatContent isInMiniApp={isInMiniApp} />
      </XMTPProvider>
    );
  }

  // Show landing page (either not authenticated, or authenticated but hasn't entered chat yet)
  return <LandingPage onEnterChat={() => setHasEnteredChat(true)} />;
}
