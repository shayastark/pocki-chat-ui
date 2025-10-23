'use client';

import { useEffect, useRef, useState } from 'react';
import { useXMTP } from '@/hooks/useXMTP';
import { usePrivy } from '@privy-io/react-auth';

interface MessageListProps {
  onTransactionRequest?: (transaction: any) => void;
}

export function MessageList({ onTransactionRequest }: MessageListProps = {}) {
  const { messages, isAgentTyping } = useXMTP();
  const { user } = usePrivy();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  const isOwnMessage = (senderAddress: string) => {
    return senderAddress?.toLowerCase() === user?.wallet?.address?.toLowerCase();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐼</div>
          <p className="text-gray-500">
            Start a conversation with your AI wallet health agent
          </p>
          <p className="text-sm text-panda-bamboo-600 mt-2">
            🎋 I'm here to help you manage your assets
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
            <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="text-2xl mb-1">
                {isOwn ? '👤' : '🐼'}
              </div>
              <div>
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
                        <div className="space-y-2 text-sm">
                          {message.transaction.calls.map((call: any, idx: number) => (
                            <div key={idx} className="bg-panda-green-50 rounded p-2">
                              <div className="font-medium">
                                {call.metadata?.description || `Call ${idx + 1}`}
                              </div>
                              {call.metadata?.transactionType && (
                                <div className="text-xs text-gray-600">
                                  Type: {call.metadata.transactionType}
                                </div>
                              )}
                              {call.metadata?.amount && call.metadata?.currency && (
                                <div className="text-xs text-gray-600">
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
                          className="w-full mt-2 bg-panda-green-600 hover:bg-panda-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Execute Transaction
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {typeof message.content === 'string' ? message.content : '[Unsupported message type]'}
                    </p>
                  )}
                </div>
                <div className={`text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                  <span className="text-gray-400">
                    {new Date(message.sentAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {hasBeenRead && (
                    <span className="ml-1" title="Read">
                      🐼
                    </span>
                  )}
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
