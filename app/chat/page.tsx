'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { XMTPProvider, useXMTP } from '@/hooks/useXMTP';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { TransactionModal } from '@/components/TransactionModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';

function ChatContent() {
  const { isConnected, isConnecting, error, refreshMessages } = useXMTP();
  const { logout, user } = usePrivy();
  const [showTxModal, setShowTxModal] = useState(false);
  const [currentTx, setCurrentTx] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMessages();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse-gentle">🐼</div>
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
          <div className="text-6xl text-center mb-4">🐼</div>
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🐼</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pocki Chat</h1>
              <p className="text-sm text-gray-500">AI Wallet Health Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-sm px-3 py-1 rounded-lg bg-panda-green-100 text-panda-green-700 hover:bg-panda-green-200 transition-colors disabled:opacity-50"
              title="Refresh messages"
            >
              {isRefreshing ? '🔄 Syncing...' : '🔄 Refresh'}
            </button>
            <div className="text-sm text-gray-600">
              {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-80px)]">
        <div className="bg-white rounded-2xl shadow-xl h-full flex flex-col overflow-hidden">
          <MessageList />
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
