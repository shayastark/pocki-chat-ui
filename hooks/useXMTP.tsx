'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { XMTP_ENV, AGENT_ADDRESS } from '@/lib/constants';

interface Message {
  id: string;
  content: string;
  senderInboxId: string;
  sentAt: Date;
}

interface Conversation {
  id: string;
  send: (content: string) => Promise<void>;
  messages: () => Promise<Message[]>;
}

interface XMTPContextType {
  client: any | null;
  conversation: Conversation | null;
  messages: Message[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  isAgentTyping: boolean;
}

const XMTPContext = createContext<XMTPContextType>({
  client: null,
  conversation: null,
  messages: [],
  isConnected: false,
  isConnecting: false,
  error: null,
  sendMessage: async () => {},
  isAgentTyping: false,
});

export function XMTPProvider({ children }: { children: ReactNode }) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [client, setClient] = useState<any | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const initializeClient = useCallback(async () => {
    const wallet = wallets[0];
    if (!authenticated || !wallet) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Dynamically import XMTP Browser SDK and ethers to avoid SWC compilation crash
      const { Client } = await import('@xmtp/browser-sdk');
      const { ethers } = await import('ethers');
      
      // Get ethers signer from Privy wallet
      const ethereumProvider = await wallet.getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const ethersSigner = await provider.getSigner();
      
      const signer: any = {
        type: 'EOA',
        getIdentifier: () => ({
          identifier: wallet.address.toLowerCase(),
          identifierKind: 'Ethereum' as const,
        }),
        signMessage: async (message: string | { message: string }): Promise<Uint8Array> => {
          // Extract message string if it's an object
          const messageText = typeof message === 'string' ? message : message.message;
          
          // Sign with ethers signer
          const signature = await ethersSigner.signMessage(messageText);
          
          // Convert hex signature to Uint8Array using ethers
          return ethers.getBytes(signature);
        },
      };

      const newClient = await Client.create(signer, {
        env: XMTP_ENV,
      });

      setClient(newClient);

      const conv = await newClient.conversations.findOrCreateDm(AGENT_ADDRESS) as any;
      setConversation(conv);

      const existingMessages = await conv.messages();
      const normalizedMessages = existingMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content as string,
        senderInboxId: msg.senderAddress || msg.senderInboxId,
        sentAt: msg.sent || msg.sentAt,
      }));
      setMessages(normalizedMessages);

      setIsConnected(true);
      setReconnectAttempts(0);
    } catch (err) {
      console.error('Failed to initialize XMTP - Full error:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
      });
      setError(err instanceof Error ? err.message : 'Failed to connect to XMTP');
      
      if (reconnectAttempts < 3) {
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          initializeClient();
        }, 5000 * (reconnectAttempts + 1));
      }
    } finally {
      setIsConnecting(false);
    }
  }, [authenticated, wallets, reconnectAttempts]);

  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      initializeClient();
    }
  }, [authenticated, wallets, initializeClient]);

  useEffect(() => {
    if (!conversation || !client) return;

    let streamActive = true;
    const streamMessages = async () => {
      try {
        const stream = await (client as any).conversations.streamAllMessages({
          onValue: (message: any) => {
            if (!streamActive) return;
            
            setMessages(prev => {
              const exists = prev.some((m: Message) => m.id === message.id);
              if (exists) return prev;
              return [...prev, {
                id: message.id,
                content: message.content as string,
                senderInboxId: message.senderAddress || message.senderInboxId,
                sentAt: message.sent || message.sentAt,
              }];
            });

            const wallet = wallets[0];
            if (wallet && message.senderInboxId !== wallet.address) {
              setIsAgentTyping(true);
              setTimeout(() => setIsAgentTyping(false), 1000);
            }
          },
          onError: (err: any) => {
            console.error('Stream error:', err);
          }
        });
      } catch (err) {
        console.error('Message stream error:', err);
        
        if (streamActive && reconnectAttempts < 6) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            streamMessages();
          }, 10000);
        }
      }
    };

    streamMessages();

    return () => {
      streamActive = false;
    };
  }, [conversation, client, wallets, reconnectAttempts]);

  const sendMessage = async (content: string) => {
    if (!conversation) {
      throw new Error('No active conversation');
    }

    try {
      await conversation.send(content);
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  };

  return (
    <XMTPContext.Provider
      value={{
        client,
        conversation,
        messages,
        isConnected,
        isConnecting,
        error,
        sendMessage,
        isAgentTyping,
      }}
    >
      {children}
    </XMTPContext.Provider>
  );
}

export const useXMTP = () => useContext(XMTPContext);
