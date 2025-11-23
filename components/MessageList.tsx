'use client';

import { useEffect, useRef, useState } from 'react';
import { useXMTP } from '@/hooks/useXMTP';
import { usePrivy } from '@privy-io/react-auth';

interface MessageListProps {
  onTransactionRequest?: (transaction: any) => void;
}

// Helper function to make URLs clickable
const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// Helper function to format timestamp as relative time
const formatTimestamp = (sentAt: Date | number | string) => {
  let timestamp: number;
  
  // Convert to timestamp (milliseconds since epoch)
  if (sentAt instanceof Date) {
    timestamp = sentAt.getTime();
  } else if (typeof sentAt === 'number') {
    timestamp = sentAt;
  } else if (typeof sentAt === 'string') {
    timestamp = new Date(sentAt).getTime();
  } else {
    // If invalid type, return placeholder instead of current time
    return '--:--';
  }
  
  // Validate the timestamp
  if (isNaN(timestamp) || timestamp <= 0) {
    // Return placeholder for invalid timestamps instead of current time
    return '--:--';
  }
  
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Same day - check if today or yesterday
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  // Less than a minute ago
  if (diffSeconds < 60) {
    return 'Just now';
  }
  
  // Less than an hour ago
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  
  // Less than 24 hours ago - show hours or "Today"
  if (diffHours < 24 && isToday) {
    if (diffHours < 1) {
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  
  // Yesterday
  if (isYesterday) {
    return 'Yesterday';
  }
  
  // Less than 7 days ago
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  
  // Older than a week - show date
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

export function MessageList({ onTransactionRequest }: MessageListProps = {}) {
  const { messages, isAgentTyping, debugInfo } = useXMTP();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  const isOwnMessage = (senderInboxId: string) => {
    return senderInboxId?.toLowerCase() === debugInfo.clientInboxId?.toLowerCase();
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
      {messages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐼</div>
          <p className="text-gray-500">
            Start a conversation with Pocki
          </p>
          <p className="text-sm text-panda-bamboo-600 mt-2">
            🎋 Your companion for intentional onchain moves
          </p>
        </div>
      )}

      {messages.map((message) => {
        const isOwn = isOwnMessage(message.senderInboxId);
        const hasBeenRead = !isOwn;
        const isTransaction = message.contentType === 'transaction';

        return (
          <div
            key={message.id}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex items-end gap-1.5 sm:gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] sm:max-w-[75%]`}>
              <div className="text-xl sm:text-2xl mb-1 flex-shrink-0">
                {isOwn ? '🎋' : '🐼'}
              </div>
              <div className="min-w-0">
                <div
                  className={`message-bubble ${
                    isOwn ? 'message-bubble-sent' : 'message-bubble-received'
                  } ${isTransaction ? 'border-2 border-panda-green-500' : ''}`}
                >
                  {isTransaction && message.transaction ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-panda-green-700">
                        💸 Transaction Request
                      </div>
                      {message.transaction.calls && message.transaction.calls.length > 0 && (
                        <div className="space-y-2 text-xs sm:text-sm">
                          {message.transaction.calls.map((call: any, idx: number) => (
                            <div key={idx} className="bg-panda-green-50 rounded p-2">
                              <div className="font-medium text-xs sm:text-sm">
                                {call.metadata?.description || `Call ${idx + 1}`}
                              </div>
                              {call.metadata?.transactionType && (
                                <div className="text-xs text-gray-600">
                                  Type: {call.metadata.transactionType}
                                </div>
                              )}
                              {call.metadata?.amount && call.metadata?.currency && (
                                <div className="text-xs text-gray-600 break-all">
                                  Amount: {call.metadata.amount / Math.pow(10, call.metadata.decimals || 18)} {call.metadata.currency}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {onTransactionRequest && (
                        <button
                          onClick={() => onTransactionRequest(message.transaction)}
                          className="w-full mt-2 bg-panda-green-600 hover:bg-panda-green-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors text-xs sm:text-sm"
                        >
                          Execute Transaction
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {typeof message.content === 'string' ? renderTextWithLinks(message.content) : '[Unsupported message type]'}
                    </p>
                  )}
                </div>
                <div className={`text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                  <span className="text-gray-400">
                    {formatTimestamp(message.sentAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {isAgentTyping && (
        <div className="flex justify-start animate-fade-in">
          <div className="flex items-end gap-2">
            <div className="text-2xl mb-1">🐼</div>
            <div className="message-bubble message-bubble-received">
              <div className="flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
