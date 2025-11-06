'use client';

import { useState } from 'react';
import { useXMTP } from '@/hooks/useXMTP';

export default function AdminDebugPanel() {
  const { 
    revokeAllInstallations, 
    clearLocalInstallationKey,
    activeWalletAddress,
    client,
    debugInfo 
  } = useXMTP();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRevoke = async () => {
    if (!confirm('⚠️ This will revoke ALL installations!\n\nYou will need to reconnect all devices.\n\nAre you sure?')) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      await revokeAllInstallations();
      setMessage('✅ All installations revoked! Refresh the page to reconnect.');
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLocal = () => {
    if (!confirm('Clear local installation key from browser storage?')) {
      return;
    }
    
    try {
      clearLocalInstallationKey();
      setMessage('✅ Local key cleared! Refresh to reconnect.');
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  const handleCheckInstallations = async () => {
    if (!client) {
      setMessage('❌ No client connected');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      const installations = await (client as any).getInstallations();
      setMessage(`📊 Current installations: ${installations.length}/10`);
      console.log('Installations:', installations);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Admin Debug Panel"
      >
        🛠️ Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-6 max-w-md w-full border-2 border-purple-200 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">🛠️ Admin Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded text-xs font-mono">
        <div className="mb-1">
          <span className="text-gray-600">Wallet:</span>{' '}
          <span className="text-purple-600">
            {activeWalletAddress ? `${activeWalletAddress.slice(0, 6)}...${activeWalletAddress.slice(-4)}` : 'Not connected'}
          </span>
        </div>
        <div className="mb-1">
          <span className="text-gray-600">Client:</span>{' '}
          <span className={client ? 'text-green-600' : 'text-red-600'}>
            {client ? '✓ Connected' : '✗ Not connected'}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Inbox ID:</span>{' '}
          <span className="text-blue-600">
            {debugInfo.clientInboxId ? `${debugInfo.clientInboxId.slice(0, 8)}...` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleCheckInstallations}
          disabled={isLoading || !client}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          📊 Check Installation Count
        </button>

        <button
          onClick={handleClearLocal}
          disabled={isLoading || !activeWalletAddress}
          className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🗑️ Clear Local Key
        </button>

        <button
          onClick={handleRevoke}
          disabled={isLoading || !client}
          className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ⚠️ Revoke All Installations
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mt-4 p-3 rounded text-sm ${
          message.startsWith('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : message.startsWith('❌')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {message}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
          Processing...
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-purple-50 rounded text-xs text-purple-900">
        <p className="font-bold mb-1">💡 Quick Guide:</p>
        <ul className="list-disc list-inside space-y-1 text-purple-800">
          <li><strong>Check</strong>: See current installation count</li>
          <li><strong>Clear Local</strong>: Remove browser cache</li>
          <li><strong>Revoke All</strong>: Clear server-side limit (resets to 0/10)</li>
        </ul>
      </div>
    </div>
  );
}
