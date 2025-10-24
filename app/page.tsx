'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { BaseAppBanner } from '@/components/BaseAppBanner';

export default function LandingPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/chat');
    }
  }, [ready, authenticated, router]);

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
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Bottom Left Logo - Base */}
      <div className="fixed bottom-4 left-4 z-10">
        <Image 
          src="/base-logo.png" 
          alt="Base" 
          width={120} 
          height={40}
          className="opacity-60 hover:opacity-100 transition-opacity"
        />
      </div>
      
      {/* Bottom Right Logo - XMTP */}
      <div className="fixed bottom-4 right-4 z-10">
        <Image 
          src="/xmtp-logo.png" 
          alt="XMTP" 
          width={120} 
          height={40}
          className="opacity-60 hover:opacity-100 transition-opacity"
        />
      </div>
      
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-6 flex justify-center">
            <Image 
              src="/pocki-logo.jpg" 
              alt="Pocki" 
              width={200} 
              height={200}
              className="rounded-3xl shadow-lg"
              priority
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Welcome to Pocki Chat
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Your AI trading companion that helps you stick to your own rules.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8 animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900">
            What is Pocki?
          </h2>
          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed text-panda-green-600">
              Pocki is your mindful AI onchain wallet companion. Like a wise panda who never rushes, 
              Pocki helps you set alerts, journal your trades, and pause before acting on impulse. 
              Trade with intention on Base.
            </p>
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
                  Monitor your portfolio health in real-time
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
            Connect Wallet to Start 🚀
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Supports wallet, email, Google, and Twitter login
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
      </div>
    </div>
  );
}
