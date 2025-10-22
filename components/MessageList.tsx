'use client';

import { useEffect, useRef } from 'react';
import { useXMTP } from '@/hooks/useXMTP';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';

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
          <div className="flex justify-center mb-4">
            <Image 
              src="/pocki-logo.jpg" 
              alt="Pocki" 
              width={120} 
              height={120} 
              className="rounded-2xl shadow-lg"
            />
          </div>
          <p className="text-gray-600 text-lg font-medium">
            Start a conversation with Pocki
          </p>
          <p className="text-sm text-panda-green-600 mt-2">
            🎋 Your AI wallet health agent is here to help
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
              <div className="flex-shrink-0 mb-1">
                {isOwn ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-panda-green-500 to-panda-bamboo-500 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {user?.wallet?.address?.slice(2, 4).toUpperCase() || 'ME'}
                  </div>
                ) : (
                  <Image 
                    src="/pocki-logo.jpg" 
                    alt="Pocki" 
                    width={32} 
                    height={32} 
                    className="rounded-full shadow-md"
                  />
                )}
              </div>
              <div>
                <div
                  className={`message-bubble ${
                    isOwn ? 'message-bubble-sent' : 'message-bubble-received'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {typeof message.content === 'string' ? message.content : '[Unsupported message type]'}
                  </p>
                </div>
                <div className={`text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                  <span className="text-gray-400">
                    {new Date(message.sentAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {hasBeenRead && (
                    <span className="ml-1" title="Read by Pocki">
                      ✓
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
            <div className="flex-shrink-0 mb-1">
              <Image 
                src="/pocki-logo.jpg" 
                alt="Pocki" 
                width={32} 
                height={32} 
                className="rounded-full shadow-md"
              />
            </div>
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
