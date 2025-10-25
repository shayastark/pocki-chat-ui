'use client';

import { useState } from 'react';
import { useXMTP } from '@/hooks/useXMTP';

export function MessageInput() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { sendMessage, isConnected } = useXMTP();

  const handleSend = async () => {
    if (!message.trim() || !isConnected || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type your message... 🎋" : "Connecting..."}
          disabled={!isConnected || isSending}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-panda-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || !isConnected || isSending}
          className="bg-panda-green-600 hover:bg-panda-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-4 sm:px-6 rounded-xl transition-colors text-sm sm:text-base min-w-[70px] sm:min-w-[90px]"
        >
          {isSending ? (
            <span className="flex items-center gap-1 sm:gap-2 justify-center">
              <span className="animate-spin">⏳</span>
              <span className="hidden sm:inline">Sending</span>
            </span>
          ) : (
            <>
              <span className="sm:hidden">🚀</span>
              <span className="hidden sm:inline">🚀 Send</span>
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2 hidden sm:block">
        Press Enter to send • Shift+Enter for new line
      </p>
    </div>
  );
}
