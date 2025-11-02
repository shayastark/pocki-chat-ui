'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BaseAppBanner } from '@/components/BaseAppBanner';
import miniappSdk from '@farcaster/miniapp-sdk';

export default function LandingPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/chat');
    }
  }, [ready, authenticated, router]);

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
          <p className="text-xs text-gray-400 mt-2">Initializing Privy...</p>
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
          <p className="text-xl text-gray-600">
            Your AI trading companion that helps you stick to your own rules.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8 animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900">
            What is Pocki?
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="text-gray-900 text-center">
              <p className="mb-3">Pocki helps you:</p>
              <ul className="list-disc list-inside space-y-2 mb-4 text-left inline-block">
                <li>Trade tokens</li>
                <li>Journal your trades</li>
                <li>Set alerts and guardrails</li>
                <li>Track social sentiment</li>
                <li>Monitor portfolio health</li>
              </ul>
              <p className="leading-relaxed">Giving you clarity and control for onchain tasks.</p>
              <p className="text-panda-green-600 font-semibold mt-4 text-lg">Trade mindfully. Intention is everything.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-4">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="font-semibold mb-2">Chat with AI</h3>
                <p className="text-sm text-gray-600">
                  Get personalized advice through secure XMTP messaging
                </p>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="font-semibold mb-2">Secure Transactions</h3>
                <p className="text-sm text-gray-600">
                  Execute transactions safely on Base network
                </p>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-semibold mb-2">Wallet Insights</h3>
                <p className="text-sm text-gray-600">
                  Monitor portfolio health and token sentiment in real-time
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={login}
            className="bg-panda-green-600 hover:bg-panda-green-700 text-white text-lg font-semibold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Connect Wallet to Start 🎋
          </button>
          <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
            Pocki only handles transactions you approve and cannot transfer funds out of any connected wallet.
          </p>
        </div>

        <div className="mt-12">
          <BaseAppBanner />
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p className="flex items-center justify-center gap-2">
            <span>Built by</span>
            <a 
              href="https://base.app/profile/shaya" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-panda-green-600 font-semibold hover:underline"
            >
              @shaya
            </a>
            <span>and</span>
            <a 
              href="https://base.app/profile/zenshortz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-panda-green-600 font-semibold hover:underline"
            >
              @zenshortz
            </a>
          </p>
        </div>

        {/* Bottom Logos - Base and XMTP */}
        <div className="mt-12 flex items-center justify-between">
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
