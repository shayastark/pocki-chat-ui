'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { XMTPProvider, useXMTP } from '@/hooks/useXMTP';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { TransactionModal } from '@/components/TransactionModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BaseAppBanner } from '@/components/BaseAppBanner';

function ChatContent() {
  const { isConnected, isConnecting, error, refreshMessages, activeWalletAddress, debugInfo, forceSyncAll, fixConversation } = useXMTP();
  const { logout } = usePrivy();
  const [showTxModal, setShowTxModal] = useState(false);
  const [currentTx, setCurrentTx] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMessages();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Test 1: Check crossOriginIsolated
    console.log('🔍 Running Test 1: Cross-Origin Isolation...');
    results.tests.crossOriginIsolated = {
      name: 'Cross-Origin Isolation',
      status: (typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated) ? 'PASS' : 'FAIL',
      value: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : 'undefined',
      message: (typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated) 
        ? 'SharedArrayBuffer enabled (CORS headers working)'
        : 'SharedArrayBuffer BLOCKED - CORS headers may be missing or incorrect',
    };

    // Test 2: XMTP Network Reachability
    console.log('🔍 Running Test 2: XMTP Network Reachability...');
    try {
      const response = await fetch('https://production.xmtp.network/', { 
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000),
      });
      results.tests.networkReachability = {
        name: 'XMTP Network Reachability',
        status: 'PASS',
        message: 'XMTP production network is reachable from browser',
      };
      console.log('✅ XMTP network is reachable');
    } catch (err) {
      results.tests.networkReachability = {
        name: 'XMTP Network Reachability',
        status: 'FAIL',
        message: `Cannot reach XMTP network: ${err instanceof Error ? err.message : 'Unknown error'}`,
        error: err,
      };
      console.error('❌ XMTP network NOT reachable:', err);
    }

    // Test 3: Check if we're in a secure context
    console.log('🔍 Running Test 3: Secure Context...');
    results.tests.secureContext = {
      name: 'Secure Context (HTTPS)',
      status: window.isSecureContext ? 'PASS' : 'FAIL',
      value: window.isSecureContext,
      message: window.isSecureContext 
        ? 'Page is served over HTTPS or localhost'
        : 'Page is NOT in a secure context (required for XMTP)',
    };

    // Test 4: Check Response Headers
    console.log('🔍 Running Test 4: Checking Response Headers...');
    try {
      const testResponse = await fetch(window.location.href, { method: 'HEAD' });
      const coep = testResponse.headers.get('Cross-Origin-Embedder-Policy');
      const coop = testResponse.headers.get('Cross-Origin-Opener-Policy');
      
      results.tests.responseHeaders = {
        name: 'Response Headers',
        status: (coep === 'require-corp' && coop === 'same-origin') ? 'PASS' : 'WARN',
        headers: {
          'Cross-Origin-Embedder-Policy': coep || 'NOT SET',
          'Cross-Origin-Opener-Policy': coop || 'NOT SET',
        },
        message: (coep === 'require-corp' && coop === 'same-origin')
          ? 'CORS headers correctly configured'
          : 'CORS headers may not be set correctly (but crossOriginIsolated might still work)',
      };
    } catch (err) {
      results.tests.responseHeaders = {
        name: 'Response Headers',
        status: 'ERROR',
        message: 'Could not check response headers',
        error: err,
      };
    }

    // Test 5: Browser Capabilities
    console.log('🔍 Running Test 5: Browser Capabilities...');
    results.tests.browserCapabilities = {
      name: 'Browser Capabilities',
      status: 'INFO',
      capabilities: {
        SharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        WebAssembly: typeof WebAssembly !== 'undefined',
        Atomics: typeof Atomics !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined',
      },
      message: 'Browser feature support status',
    };

    console.log('📊 Diagnostic Results:', results);
    setDiagnosticResults(results);
    setIsRunningDiagnostics(false);
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50">
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
          <p className="mt-4 text-gray-600">Connecting to XMTP...</p>
          <p className="text-sm text-gray-400 mt-2">🎋 Setting up secure messaging</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="flex justify-center mb-4">
            <Image 
              src="/pocki-logo.jpg" 
              alt="Pocki" 
              width={120} 
              height={120}
              className="rounded-2xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">
            Connection Error
          </h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
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
                <h1 className="text-base sm:text-xl font-bold text-gray-900">Pocki Chat</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Mindful AI Trading Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg bg-panda-green-100 text-panda-green-700 hover:bg-panda-green-200 transition-colors disabled:opacity-50"
                title="Refresh messages"
              >
                {isRefreshing ? '🔄' : '🔄'}
                <span className="hidden sm:inline ml-1">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                title="Toggle debug panel"
              >
                🔍
                <span className="hidden md:inline ml-1">{showDebug ? 'Hide' : 'Debug'}</span>
              </button>
              <div className="text-xs sm:text-sm text-gray-600 hidden md:block" title={activeWalletAddress || 'No wallet connected'}>
                {activeWalletAddress ? `${activeWalletAddress.slice(0, 6)}...${activeWalletAddress.slice(-4)}` : 'No wallet'}
              </div>
              <button
                onClick={logout}
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="sm:hidden">↗</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebug && (
        <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 sm:p-4 shadow-lg overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-yellow-900 text-sm sm:text-base">🔍 DEBUG PANEL</h3>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={runDiagnostics}
                  disabled={isRunningDiagnostics}
                  className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {isRunningDiagnostics ? '⏳' : '🔬'}
                  <span className="hidden sm:inline ml-1">{isRunningDiagnostics ? 'Running...' : 'Diagnostics'}</span>
                </button>
                <button 
                  onClick={() => setShowDebug(false)}
                  className="text-yellow-700 hover:text-yellow-900"
                >✕</button>
              </div>
            </div>
            
            <div className="space-y-2 text-xs sm:text-sm font-mono overflow-x-auto">
              <div>
                <strong>Client Inbox ID:</strong> <span className="break-all">{debugInfo.clientInboxId || 'N/A'}</span>
              </div>
              <div>
                <strong>Target Agent Inbox ID:</strong> <span className="break-all">{debugInfo.targetAgentInboxId}</span>
              </div>
              <div className={`p-2 rounded ${debugInfo.conversationPeerInboxId === debugInfo.targetAgentInboxId ? 'bg-green-100' : 'bg-red-100'}`}>
                <strong>Active Conv Peer Inbox ID:</strong>
                <div className="break-all mt-1 text-xs">{debugInfo.conversationPeerInboxId || 'N/A'}</div>
                {debugInfo.conversationPeerInboxId === debugInfo.targetAgentInboxId && <span className="ml-2 text-green-700 font-bold">✓ MATCH</span>}
                {debugInfo.conversationPeerInboxId && debugInfo.conversationPeerInboxId !== debugInfo.targetAgentInboxId && (
                  <div className="mt-2 text-red-700 font-bold">✗ MISMATCH! Sending to wrong conversation!</div>
                )}
              </div>
              <div>
                <strong>Conversation ID:</strong> {debugInfo.conversationId || 'N/A'}
              </div>
              <div>
                <strong>Total Conversations:</strong> {debugInfo.allConversations.length}
              </div>
              
              {debugInfo.allConversations.length > 1 && (
                <div className="mt-2 p-2 bg-orange-100 rounded">
                  <strong className="text-orange-900">⚠️ Multiple Conversations Detected:</strong>
                  {debugInfo.allConversations.map((conv: any, idx: number) => (
                    <div key={idx} className="ml-4 mt-1 text-xs">
                      {idx + 1}. Peer: {conv.peerInboxId || 'N/A'}
                      {conv.peerInboxId === debugInfo.targetAgentInboxId && <span className="text-green-700"> ← TARGET</span>}
                    </div>
                  ))}
                </div>
              )}
              
              {debugInfo.conversationPeerInboxId && debugInfo.conversationPeerInboxId !== debugInfo.targetAgentInboxId && (
                <button 
                  onClick={async () => {
                    setIsFixing(true);
                    await fixConversation();
                    setIsFixing(false);
                  }}
                  disabled={isFixing}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full font-bold disabled:opacity-50"
                >
                  {isFixing ? '🔧 Fixing...' : '🔧 FIX CONVERSATION - Switch to Correct Agent'}
                </button>
              )}
              
              <button 
                onClick={forceSyncAll}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 w-full"
              >
                🔄 Force Sync All Conversations
              </button>
              
              <button 
                onClick={async () => {
                  if (confirm('⚠️ This will clear all XMTP data and reload the page. You will need to log in again. Continue?')) {
                    try {
                      // Delete all XMTP databases
                      const databases = await indexedDB.databases();
                      for (const db of databases) {
                        if (db.name?.includes('xmtp') || db.name?.includes('XMTP')) {
                          console.log('Deleting database:', db.name);
                          indexedDB.deleteDatabase(db.name);
                        }
                      }
                      
                      // Wait a moment for deletion to complete
                      await new Promise(resolve => setTimeout(resolve, 500));
                      
                      // Reload the page to force fresh initialization
                      window.location.reload();
                    } catch (err) {
                      console.error('Failed to clear XMTP database:', err);
                      alert('Failed to clear database. Please try manually clearing browser data for this site.');
                    }
                  }
                }}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full font-bold"
              >
                🗑️ Clear XMTP Database (Fix Stuck States)
              </button>
            </div>

            {/* Diagnostic Results */}
            {diagnosticResults && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded">
                <h4 className="font-bold text-blue-900 mb-2">📊 Diagnostic Test Results</h4>
                <div className="space-y-2">
                  {Object.entries(diagnosticResults.tests).map(([key, test]: [string, any]) => (
                    <div key={key} className={`p-2 rounded text-xs ${
                      test.status === 'PASS' ? 'bg-green-100 border border-green-300' :
                      test.status === 'FAIL' ? 'bg-red-100 border border-red-300' :
                      test.status === 'WARN' ? 'bg-yellow-100 border border-yellow-300' :
                      'bg-gray-100 border border-gray-300'
                    }`}>
                      <div className="font-bold flex justify-between items-center">
                        <span>{test.name}</span>
                        <span className={`px-2 py-0.5 rounded ${
                          test.status === 'PASS' ? 'bg-green-600 text-white' :
                          test.status === 'FAIL' ? 'bg-red-600 text-white' :
                          test.status === 'WARN' ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {test.status}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-700">{test.message}</div>
                      {test.value !== undefined && (
                        <div className="mt-1"><strong>Value:</strong> {JSON.stringify(test.value)}</div>
                      )}
                      {test.headers && (
                        <div className="mt-1">
                          <strong>Headers:</strong>
                          <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(test.headers, null, 2)}</pre>
                        </div>
                      )}
                      {test.capabilities && (
                        <div className="mt-1">
                          <strong>Capabilities:</strong>
                          <div className="grid grid-cols-2 gap-1 mt-1">
                            {Object.entries(test.capabilities).map(([cap, supported]: [string, any]) => (
                              <div key={cap} className="flex items-center gap-1">
                                <span>{supported ? '✅' : '❌'}</span>
                                <span>{cap}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Ran at: {new Date(diagnosticResults.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`max-w-6xl mx-auto p-4 space-y-4 ${showDebug ? 'h-[calc(100vh-360px)]' : 'h-[calc(100vh-80px)]'}`}>
        <div className="bg-white rounded-2xl shadow-xl h-full flex flex-col overflow-hidden">
          <MessageList onTransactionRequest={(tx) => {
            console.log('Transaction requested:', tx);
            setCurrentTx(tx);
            setShowTxModal(true);
          }} />
          <MessageInput />
        </div>
        <BaseAppBanner />
      </div>

      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        transaction={currentTx}
      />
    </div>
  );
}

export default function ChatPage() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse-gentle">🐼</div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <XMTPProvider>
      <ChatContent />
    </XMTPProvider>
  );
}
