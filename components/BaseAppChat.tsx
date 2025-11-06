'use client';

import { AGENT_WALLET_ADDRESS, AGENT_BASENAME } from '@/lib/constants';
import Image from 'next/image';
import { useState } from 'react';

/**
 * Base App Native XMTP Chat Component
 * 
 * Since Base App has XMTP built into their native messaging,
 * we redirect users to Base App's DM interface instead of 
 * trying to initialize XMTP Browser SDK in the restricted iframe.
 */
export function BaseAppChat() {
  const [copied, setCopied] = useState(false);

  const openBaseAppDM = () => {
    // Use Base App's messaging deeplink format from the official documentation
    // Format: cbwallet://messaging/address
    // Address must be 0x wallet address (hex format), NOT ENS basename
    
    // Create the deeplink per Base documentation
    const messagingDeeplink = `cbwallet://messaging/${AGENT_WALLET_ADDRESS}`;
    
    // Open the deeplink (will open DM directly in Base App)
    window.location.href = messagingDeeplink;
  };

  return (
    <div className="min-h-screen p-6" style={{backgroundColor: 'white'}}>
      <div className="max-w-2xl mx-auto pt-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#E6FC9A] to-[#d4e889] text-gray-900 rounded-3xl p-8 shadow-2xl mb-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Image 
                src="/pocki-logo.jpg" 
                alt="Pocki" 
                width={100} 
                height={100}
                className="rounded-2xl shadow-lg"
              />
            </div>
            <div className="text-7xl mb-4">💬</div>
            <h1 className="text-4xl font-bold mb-3">
              Chat with Pocki
            </h1>
            <p className="text-gray-700 text-lg mb-2">
              Your AI trading companion on Base
            </p>
          </div>

          <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-xl mb-3 text-center">
              💙 Base App Native Messaging
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Great news! Base App has XMTP messaging built right into the platform. Click below to open a secure, end-to-end encrypted direct message with Pocki's AI agent.
            </p>
            <p className="text-gray-600 text-sm">
              ✨ Your messages persist in Base App's message history<br/>
              🔒 Secure XMTP protocol ensures privacy<br/>
              💰 Approve transactions right from the chat
            </p>
          </div>

          <button
            onClick={openBaseAppDM}
            className="w-full bg-white text-gray-900 font-bold text-lg py-5 px-6 rounded-2xl hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl mb-4"
          >
            Chat with Pocki in Base App 🟦
          </button>

          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              Or message Pocki directly yourself in Base App:
            </p>
            <div className="bg-white/20 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg text-sm font-mono">
              {AGENT_BASENAME}
            </div>
            <p className="text-gray-600 text-xs mt-2">
              Search in Base App → Open profile → Tap "Message" to chat
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-semibold text-xl mb-4 text-gray-800">
            🐼 How It Works
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Open the chat:</strong> Click the button above to chat with Pocki in your Base App account
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Start chatting:</strong> Send your first message to Pocki (e.g., "In what ways can you help me?")
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Get AI assistance:</strong> Pocki responds with market data, social sentiment, wallet analysis, and more
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Execute trades:</strong> Approve transactions directly in Base App's wallet
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What Pocki Can Do */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-semibold text-xl mb-4 text-gray-800">
            🎋 What Pocki Can Help You With
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">👛</div>
              <div>
                <h4 className="font-semibold text-gray-800">Trade Tokens</h4>
                <p className="text-sm text-gray-600">
                  Execute trades on Base with AI guidance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h4 className="font-semibold text-gray-800">Market Analysis</h4>
                <p className="text-sm text-gray-600">
                  Get real-time sentiment and price data
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">📝</div>
              <div>
                <h4 className="font-semibold text-gray-800">Trade Journal</h4>
                <p className="text-sm text-gray-600">
                  Track and reflect on your trading history
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔔</div>
              <div>
                <h4 className="font-semibold text-gray-800">Set Alerts</h4>
                <p className="text-sm text-gray-600">
                  Get notified about price movements
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <h4 className="font-semibold text-gray-800">Guardrails</h4>
                <p className="text-sm text-gray-600">
                  Set rules to prevent emotional trading
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">💼</div>
              <div>
                <h4 className="font-semibold text-gray-800">Portfolio Health</h4>
                <p className="text-sm text-gray-600">
                  Monitor wallet performance metrics
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Platforms */}
        <div className="bg-gray-50 rounded-2xl p-6 shadow-md">
          <h3 className="font-semibold text-lg mb-3 text-gray-800">
            Want to Use Pocki Elsewhere?
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Pocki Chat also works directly in your browser with an embedded chat interface:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <span>🌐</span>
              <span>Web browsers (Chrome, Safari, Firefox)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span>💜</span>
              <span>Farcaster Mini App</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
