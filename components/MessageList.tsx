'use client';

import { useEffect, useRef } from 'react';
import { useXMTP } from '@/hooks/useXMTP';
import { usePrivy } from '@privy-io/react-auth';

export function MessageList() {
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
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content as string}</p>
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
