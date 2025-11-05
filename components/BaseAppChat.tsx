'use client';

import { AGENT_ADDRESS } from '@/lib/constants';
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
    // Try different URL formats to open Base App DM
    // Format 1: Direct DM URL (most likely)
    const dmUrl = `https://base.app/dm/${AGENT_ADDRESS}`;
    
    // Open in same tab (since we're in iframe, this should navigate within Base App)
    window.open(dmUrl, '_self');
    
    // Alternative: Try opening in parent frame
    // window.parent.postMessage({ type: 'OPEN_DM', inboxId: AGENT_ADDRESS }, '*');
  };

  const copyAgentInboxId = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl p-8 shadow-2xl mb-6">
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
            <p className="text-blue-100 text-lg mb-2">
              Your AI trading companion on Base
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-xl mb-3 text-center">
              🎯 Base App Native Messaging
            </h2>
            <p className="text-blue-50 leading-relaxed mb-4">
              Great news! Base App has XMTP messaging built right into the platform. 
              Click below to open a secure, end-to-end encrypted direct message with Pocki's AI agent.
            </p>
            <p className="text-blue-100 text-sm">
              ✨ Your messages persist in Base App's message history<br/>
              🔒 Secure XMTP protocol ensures privacy<br/>
              💰 Approve transactions right from the chat
            </p>
          </div>

          <button
            onClick={openBaseAppDM}
            className="w-full bg-white text-blue-600 font-bold text-lg py-5 px-6 rounded-2xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl mb-4"
          >
            Open Pocki Chat in Base App 🎋
          </button>

          <div className="text-center">
            <p className="text-blue-100 text-sm mb-2">
              Or copy Pocki's Inbox ID to start a DM manually:
            </p>
            <button
              onClick={copyAgentInboxId}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm transition-all"
            >
              {copied ? '✅ Copied!' : '📋 Copy Inbox ID'}
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-semibold text-xl mb-4 text-gray-800">
            🚀 How It Works
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Open the chat:</strong> Click the button above to navigate to Base App's native messaging
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Start chatting:</strong> Send your first message to Pocki (e.g., "Help me trade DEGEN")
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Get AI assistance:</strong> Pocki responds with market data, trade suggestions, and analysis
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Execute trades:</strong> Approve transactions that Pocki sends through Base App's wallet
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
              <div className="text-2xl">💱</div>
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
            🌐 Want to Use Pocki Elsewhere?
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
          <p className="text-gray-500 text-xs mt-3">
            Visit Pocki Chat in a regular browser for the embedded experience
          </p>
        </div>

        {/* Technical Note */}
        <div className="mt-6 text-center text-gray-500 text-xs">
          <details className="cursor-pointer">
            <summary className="hover:text-gray-700">
              🔧 Technical details (for developers)
            </summary>
            <p className="mt-2 text-left bg-gray-100 p-3 rounded-lg">
              <strong>Why redirect to Base App messaging?</strong><br/>
              XMTP Browser SDK v5 requires OPFS (Origin Private File System) for local storage,
              which is blocked in iframe contexts due to browser security policies.
              Since Base App already has XMTP messaging built into their platform,
              we leverage their native implementation instead of fighting iframe restrictions.
              This provides a better UX and requires zero additional infrastructure.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
