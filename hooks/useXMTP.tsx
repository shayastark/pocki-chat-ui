'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode, useCallback } from 'react';
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
  send: (content: string) => Promise<string | void>;
  messages: () => Promise<Message[]>;
  members?: () => Promise<any[]>;
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
  const { wallets, ready } = useWallets();
  const [client, setClient] = useState<any | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const isInitializing = useRef(false);
  const hasInitialized = useRef(false);

  const initializeClient = useCallback(async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing.current) {
      console.log('Already initializing, skipping...');
      return;
    }

    // Wait for wallets to be ready
    if (!authenticated || !ready) {
      return;
    }

    // Find embedded wallet or use first available
    const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
    
    if (!wallet) {
      console.error('No wallet found');
      setError('No wallet available. Please connect a wallet.');
      return;
    }

    isInitializing.current = true;
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

      // Revoke all other installations to prevent hitting the 10 installation limit
      // This keeps only the current installation active
      try {
        await newClient.revokeAllOtherInstallations();
        console.log('Successfully revoked old installations');
      } catch (revokeErr) {
        console.warn('Could not revoke old installations:', revokeErr);
        // Continue anyway - this might fail on first installation
      }

      setClient(newClient);

      // Check if agent address is configured
      if (!AGENT_ADDRESS) {
        throw new Error('Agent address not configured. Please set NEXT_PUBLIC_AGENT_ADDRESS environment variable.');
      }

      console.log('Finding or creating conversation with agent inbox ID:', AGENT_ADDRESS);

      // Try to get existing DM first, create new one if it doesn't exist
      let conv;
      try {
        conv = await (newClient.conversations as any).getDmByInboxId(AGENT_ADDRESS);
        console.log('Found existing DM with agent');
      } catch (getDmErr) {
        console.log('No existing DM found, creating new one...');
        conv = await (newClient.conversations as any).newDm(AGENT_ADDRESS);
        console.log('Created new DM with agent');
      }
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
      hasInitialized.current = true;
    } catch (err) {
      console.error('Failed to initialize XMTP - Full error:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
      });
      
      // Check if user rejected the signature request
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        setError('You need to sign the message to connect to XMTP. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to connect to XMTP');
      }
    } finally {
      setIsConnecting(false);
      isInitializing.current = false;
    }
  }, [authenticated, ready, wallets]);

  useEffect(() => {
    if (authenticated && ready && wallets.length > 0 && !client && !hasInitialized.current) {
      initializeClient();
    }
  }, [authenticated, ready, wallets, client, initializeClient]);

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
        // Stream will be restarted if conversation/client changes
      }
    };

    streamMessages();

    return () => {
      streamActive = false;
    };
  }, [conversation, client, wallets]);

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
