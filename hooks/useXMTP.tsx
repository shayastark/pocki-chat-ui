'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { XMTP_ENV, AGENT_ADDRESS } from '@/lib/constants';

interface Message {
  id: string;
  content: string;
  senderInboxId: string;
  sentAt: Date;
  contentType?: 'text' | 'transaction';
  transaction?: any; // WalletSendCallsParams
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
  refreshMessages: () => Promise<void>;
  activeWalletAddress: string | null;
  // Debug properties
  debugInfo: {
    clientInboxId: string | null;
    conversationId: string | null;
    conversationPeerInboxId: string | null;
    targetAgentInboxId: string;
    allConversations: any[];
  };
  forceSyncAll: () => Promise<void>;
  fixConversation: () => Promise<void>;
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
  refreshMessages: async () => {},
  activeWalletAddress: null,
  debugInfo: {
    clientInboxId: null,
    conversationId: null,
    conversationPeerInboxId: null,
    targetAgentInboxId: AGENT_ADDRESS,
    allConversations: [],
  },
  forceSyncAll: async () => {},
  fixConversation: async () => {},
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
  const [activeWalletAddress, setActiveWalletAddress] = useState<string | null>(null);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [conversationPeerInboxId, setConversationPeerInboxId] = useState<string | null>(null);
  const isInitializing = useRef(false);
  const hasInitialized = useRef(false);
  const isSyncing = useRef(false);
  const autoSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const walletRetryCountRef = useRef(0);

  const initializeClient = useCallback(async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing.current) {
      console.log('Already initializing, skipping...');
      return;
    }

    // Wait for wallets to be ready
    if (!authenticated || !ready) {
      console.log('🔍 Waiting for auth/ready:', { authenticated, ready });
      return;
    }

    // SMART WALLET DETECTION: Determine which wallet type we expect
    const walletTypes = wallets.map(w => w.walletClientType);
    const hasBaseAccount = walletTypes.includes('base_account');
    const hasDetectedWallets = wallets.some(w => 
      w.walletClientType !== 'privy' && 
      w.walletClientType !== 'base_account'
    );
    
    // Log wallet detection state
    console.log('🔍 WALLET DETECTION:', {
      authenticated,
      ready,
      walletsCount: wallets.length,
      walletTypes: wallets.map(w => ({ type: w.walletClientType, address: w.address })),
      hasBaseAccount,
      hasDetectedWallets,
      retryCount: walletRetryCountRef.current,
    });

    // SMART RETRY LOGIC: Wait for specific wallet types based on context
    // Priority: base_account > detected wallets > embedded wallet
    let expectedWalletType = 'any';
    let shouldRetry = false;
    
    // If we detect we're in a Base App context (has auth but waiting for base_account)
    if (!hasBaseAccount && walletRetryCountRef.current < 10) {
      // Check if this might be Base App by looking for signs
      // Base App takes time to inject its wallet after auth
      const mightBeBaseApp = wallets.length === 0 || wallets.every(w => w.walletClientType === 'privy');
      
      if (mightBeBaseApp && walletRetryCountRef.current < 5) {
        // Give Base App extra time to inject its wallet (first 2.5 seconds)
        expectedWalletType = 'base_account';
        shouldRetry = true;
        console.log('🎯 Waiting for Base App wallet to initialize...');
      }
    }
    
    // For desktop browser extensions (detected wallets take time to inject)
    if (!shouldRetry && wallets.length === 0 && walletRetryCountRef.current < 10) {
      expectedWalletType = 'browser extension or embedded wallet';
      shouldRetry = true;
      console.log('🔌 Waiting for browser extension wallets to inject...');
    }

    // Find the best available wallet
    // Priority: base_account > detected wallets > embedded wallet
    const wallet = 
      wallets.find(w => w.walletClientType === 'base_account') ||
      wallets.find(w => w.walletClientType !== 'privy') ||
      wallets.find(w => w.walletClientType === 'privy') ||
      wallets[0];
    
    if (!wallet) {
      if (shouldRetry) {
        walletRetryCountRef.current += 1;
        console.warn(`⚠️ No ${expectedWalletType} wallet found yet (attempt ${walletRetryCountRef.current}/10)`);
        
        setIsConnecting(true);
        setTimeout(() => {
          initializeClient();
        }, 500);
        return;
      } else {
        console.error('❌ No wallet found after retries');
        setError('No wallet available. Please connect a wallet and refresh the page.');
        setIsConnecting(false);
        return;
      }
    }

    // Wallet found! Reset retry counter and log selection
    walletRetryCountRef.current = 0;
    console.log('✅ Wallet found! Initializing XMTP...');
    console.log('📱 Selected wallet:', {
      type: wallet.walletClientType,
      address: wallet.address,
      isBaseAccount: wallet.walletClientType === 'base_account',
      isPrivy: wallet.walletClientType === 'privy',
    });
    setActiveWalletAddress(wallet.address);

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

      // Import codecs before creating client
      // CRITICAL: XMTP Browser SDK v5 requires codecs passed during creation
      const { ReplyCodec } = await import('@xmtp/content-type-reply');
      const { WalletSendCallsCodec, ContentTypeWalletSendCalls } = await import('@xmtp/content-type-wallet-send-calls');

      const newClient = await Client.create(signer, {
        env: XMTP_ENV,
        codecs: [new ReplyCodec(), new WalletSendCallsCodec()],
      });
      console.log('✅ Created XMTP client with ReplyCodec and WalletSendCallsCodec');
      console.log('🌍 XMTP Environment:', XMTP_ENV);
      console.log('📬 Client Inbox ID:', newClient.inboxId);
      console.log('🎯 Target Agent Inbox ID:', AGENT_ADDRESS);

      // NOTE: Removed auto-revocation of old installations as it causes "Unknown signer" errors
      // Users can manually clear XMTP data if needed by clearing browser storage
      let didRevokeInstallations = false;

      setClient(newClient);

      // Check if agent address is configured
      if (!AGENT_ADDRESS) {
        throw new Error('Agent address not configured. Please set NEXT_PUBLIC_AGENT_ADDRESS environment variable.');
      }

      console.log('Finding or creating conversation with agent inbox ID:', AGENT_ADDRESS);

      // Sync all conversations and messages once (v5.0.1 recommended approach)
      // NOTE: Skip sync if we just revoked installations - revoked installations cannot be synced
      if (didRevokeInstallations) {
        console.warn('⚠️ Skipping syncAll() after revoking installations');
        console.warn('Revoked installations cannot be synced. Will create fresh conversation...');
      } else {
        console.log('🔄 Syncing all conversations and messages (including all consent states)...');
        try {
          await (newClient.conversations as any).syncAll(['allowed', 'unknown', 'denied']);
          console.log('✅ Successfully synced all conversations');
        } catch (syncErr: any) {
          console.error('❌ Sync failed unexpectedly:', syncErr);
          throw syncErr;
        }
      }
      
      // DEBUG: List all conversations to diagnose duplicates
      const allConvs = await (newClient.conversations as any).list();
      console.log(`📋 Total conversations: ${allConvs.length}`);
      
      // Find ALL DMs with the agent
      const agentDMs = [];
      for (const [idx, c] of allConvs.entries()) {
        const peerInboxId = await c.peerInboxId();
        const isAgentDM = peerInboxId === AGENT_ADDRESS && !c.isGroup;
        console.log(`Conversation ${idx + 1}:`, {
          id: c.id,
          peerInboxId,
          createdAt: c.createdAt,
          isGroup: c.isGroup,
          isAgentDM,
        });
        if (isAgentDM) {
          agentDMs.push(c);
        }
      }
      
      console.log(`🚨 CRITICAL: Found ${agentDMs.length} DM conversation(s) with agent`);
      
      let conv = null;
      
      if (agentDMs.length > 1) {
        console.warn('⚠️ WARNING: Multiple DM conversations found with same agent!');
        console.warn('📊 Analyzing conversations to choose the active one...');
        
        // Get message counts for all duplicates
        const conversationsWithCounts = await Promise.all(
          agentDMs.map(async (dm, idx) => {
            const messages = await dm.messages();
            return {
              conversation: dm,
              messageCount: messages.length,
              index: idx + 1,
              id: dm.id,
              createdAt: dm.createdAt,
            };
          })
        );
        
        // Log all duplicates
        console.warn('All agent DM conversations:');
        conversationsWithCounts.forEach(c => {
          console.warn(`  DM ${c.index}: ${c.messageCount} messages, created ${c.createdAt}, id: ${c.id}`);
        });
        
        // Choose the conversation with the most messages (the active one)
        const activeConv = conversationsWithCounts.reduce((prev, current) => 
          current.messageCount > prev.messageCount ? current : prev
        );
        
        conv = activeConv.conversation;
        console.log(`✅ CHOSE DM ${activeConv.index} with ${activeConv.messageCount} messages as the active conversation`);
        console.log(`📋 Active conversation ID: ${activeConv.id}`);
      } else if (agentDMs.length === 1) {
        // Only one conversation found, use it
        conv = agentDMs[0];
        const msgCount = (await conv.messages()).length;
        console.log(`✅ Found single DM with agent (${msgCount} messages)`);
      }
      
      setAllConversations(allConvs);
      
      // If no existing conversation found, create new one
      if (!conv) {
        console.log('⚠️ No existing DM found, creating new one...');
        conv = await (newClient.conversations as any).newDm(AGENT_ADDRESS);
        console.log('✅ Created new DM with agent');
        const peerInboxId = await conv.peerInboxId();
        console.log('📋 New conversation details:', {
          id: conv.id,
          peerInboxId,
          createdAt: conv.createdAt,
        });
        
        // After creating new DM, sync again to ensure it's registered
        await (newClient.conversations as any).syncAll(['allowed', 'unknown', 'denied']);
      }
      
      // Check and update consent state for the active conversation
      const peerInboxId = await conv.peerInboxId();
      const consentState = await conv.consentState();
      console.log('📋 Active conversation details:', {
        id: conv.id,
        peerInboxId,
        createdAt: conv.createdAt,
        consentState,
      });
      
      // If consent is denied or unknown, allow it
      if (consentState !== 'allowed') {
        console.warn(`⚠️ WARNING: Conversation consent is "${consentState}", setting to "allowed"...`);
        await conv.updateConsentState('allowed');
        console.log('✅ Updated conversation consent to "allowed"');
      }
      
      setConversation(conv);

      const existingMessages = await conv.messages();
      console.log(`Initial load: Fetched ${existingMessages.length} messages`);
      
      // Filter for text messages and text replies
      const normalizedMessages = existingMessages
        .map((msg: any) => {
          let textContent: string | null = null;
          
          // Direct text content
          if (typeof msg.content === 'string') {
            textContent = msg.content;
          }
          // Text reply (agent responses)
          else if (msg.contentType?.typeId === 'reply') {
            if (typeof msg.content?.content === 'string') {
              textContent = msg.content.content;
            } else if (typeof msg.contentFallback === 'string') {
              textContent = msg.contentFallback;
            }
          }
          
          return textContent ? {
            id: msg.id,
            content: textContent,
            senderInboxId: msg.senderAddress || msg.senderInboxId,
            sentAt: msg.sent || msg.sentAt,
          } : null;
        })
        .filter((msg: Message | null): msg is Message => msg !== null);
      
      console.log(`Initial load: Displaying ${normalizedMessages.length} text messages`);
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
    // Trigger initialization when authenticated and ready
    // Even if wallets.length is 0, the retry logic in initializeClient will handle waiting
    if (authenticated && ready && !client && !hasInitialized.current) {
      console.log('🚀 Triggering XMTP initialization:', { 
        authenticated, 
        ready, 
        walletsCount: wallets.length,
        hasClient: !!client,
        hasInitialized: hasInitialized.current 
      });
      initializeClient();
    }
  }, [authenticated, ready, wallets, client, initializeClient]);

  // Fetch peer inbox ID when conversation changes
  useEffect(() => {
    if (conversation) {
      (async () => {
        const peerInboxId = await (conversation as any).peerInboxId();
        setConversationPeerInboxId(peerInboxId);
      })();
    } else {
      setConversationPeerInboxId(null);
    }
  }, [conversation]);

  useEffect(() => {
    if (!conversation || !client) return;

    let streamActive = true;
    const streamMessages = async () => {
      try {
        // Import content types for detection
        const { ContentTypeWalletSendCalls } = await import('@xmtp/content-type-wallet-send-calls');
        const { ContentTypeReply } = await import('@xmtp/content-type-reply');
        
        const stream = await (client as any).conversations.streamAllMessages({
          onValue: (message: any) => {
            if (!streamActive) return;
            
            const senderInboxId = message.senderAddress || message.senderInboxId;
            const isFromAgent = senderInboxId === AGENT_ADDRESS;
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📨 NEW MESSAGE ${isFromAgent ? 'FROM POCKI 🎋' : 'FROM YOU'}`);
            console.log('Time:', new Date().toLocaleTimeString());
            console.log('Sender:', senderInboxId);
            console.log('Content Type:', message.contentType?.typeId);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            let textContent: string | null = null;
            let messageType: 'text' | 'transaction' = 'text';
            let transactionData: any = null;
            
            // Handle different content types using XMTP recommended sameAs() method
            if (message.contentType && message.contentType.sameAs(ContentTypeWalletSendCalls)) {
              // Transaction message
              console.log('💸 TRANSACTION MESSAGE RECEIVED!');
              console.log('🔍 Transaction structure:', {
                version: message.content?.version,
                from: message.content?.from,
                chainId: message.content?.chainId,
                callsCount: message.content?.calls?.length,
                calls: message.content?.calls?.map((call: any, idx: number) => ({
                  index: idx,
                  to: call.to,
                  value: call.value,
                  hasData: !!call.data,
                  dataLength: call.data?.length,
                  metadata: call.metadata
                }))
              });
              messageType = 'transaction';
              transactionData = message.content;
              textContent = message.contentFallback || 'Transaction Request';
            } else if (message.contentType && message.contentType.sameAs(ContentTypeReply)) {
              // Reply message (Pocki's responses)
              console.log('💬 REPLY MESSAGE RECEIVED!');
              if (typeof message.content?.content === 'string') {
                textContent = message.content.content;
                const preview = message.content.content.substring(0, 100) + (message.content.content.length > 100 ? '...' : '');
                console.log('📝 Reply text:', preview);
              } else if (typeof message.contentFallback === 'string') {
                textContent = message.contentFallback;
                const preview = message.contentFallback.substring(0, 100) + (message.contentFallback.length > 100 ? '...' : '');
                console.log('📝 Reply fallback:', preview);
              } else {
                console.log('⚠️ Reply has no extractable text content');
                return;
              }
            } else if (typeof message.content === 'string') {
              console.log('📝 TEXT MESSAGE:', message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''));
              textContent = message.content;
            } else {
              console.log('⚠️ Skipping unsupported message type:', message.contentType?.typeId || 'unknown');
              return;
            }
            
            setMessages(prev => {
              // Check if message already exists by ID
              const exists = prev.some((m: Message) => m.id === message.id);
              if (exists) return prev;
              
              // Normalize timestamp to Date object
              let normalizedTimestamp: Date;
              const rawTimestamp = message.sent || message.sentAt;
              if (rawTimestamp instanceof Date) {
                normalizedTimestamp = rawTimestamp;
              } else if (typeof rawTimestamp === 'number') {
                normalizedTimestamp = new Date(rawTimestamp);
              } else if (rawTimestamp && typeof rawTimestamp === 'object' && 'toDate' in rawTimestamp) {
                normalizedTimestamp = (rawTimestamp as any).toDate();
              } else {
                normalizedTimestamp = new Date();
              }
              
              return [...prev, {
                id: message.id,
                content: textContent || '',
                senderInboxId: message.senderAddress || message.senderInboxId,
                sentAt: normalizedTimestamp,
                contentType: messageType,
                transaction: transactionData,
              }];
            });

            // Turn off typing indicator when Pocki's response arrives
            const wallet = wallets[0];
            if (wallet && message.senderInboxId !== wallet.address) {
              setIsAgentTyping(false);
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


  const refreshMessages = useCallback(async () => {
    if (!conversation || !client || isSyncing.current) return;

    isSyncing.current = true;
    try {
      console.log('Manually syncing messages (including all consent states)...');
      await (client.conversations as any).syncAll(['allowed', 'unknown', 'denied']);
      
      const updatedMessages = await conversation.messages();
      console.log(`Fetched ${updatedMessages.length} total messages from DB`);
      
      // Import content types for detection
      const { ContentTypeWalletSendCalls } = await import('@xmtp/content-type-wallet-send-calls');
      const { ContentTypeReply } = await import('@xmtp/content-type-reply');
      
      const normalizedMessages = updatedMessages
        .map((msg: any) => {
          // Handle different content types using XMTP stable filter pattern
          let textContent: string | null = null;
          let messageType: 'text' | 'transaction' = 'text';
          let transactionData: any = null;
          
          // Transaction message using XMTP recommended sameAs() method
          if (msg.contentType && msg.contentType.sameAs(ContentTypeWalletSendCalls)) {
            console.log('💸 Found transaction message in history:', msg.content);
            console.log('🔍 Transaction structure:', {
              version: msg.content?.version,
              from: msg.content?.from,
              chainId: msg.content?.chainId,
              callsCount: msg.content?.calls?.length,
              calls: msg.content?.calls?.map((call: any, idx: number) => ({
                index: idx,
                to: call.to,
                value: call.value,
                hasData: !!call.data,
                dataLength: call.data?.length,
                metadata: call.metadata
              }))
            });
            messageType = 'transaction';
            transactionData = msg.content;
            textContent = msg.contentFallback || 'Transaction Request';
          }
          // Text reply (Pocki's responses) - XMTP recommended pattern
          else if (msg.contentType && msg.contentType.sameAs(ContentTypeReply)) {
            console.log('🔍 DEBUG Reply message:', {
              id: String(msg.id),
              senderInboxId: String(msg.senderInboxId),
              hasContent: !!msg.content,
              contentType: typeof msg.content,
              hasContentContent: !!msg.content?.content,
              contentContentType: typeof msg.content?.content,
              hasFallback: !!msg.contentFallback,
              fallbackType: typeof msg.contentFallback,
            });
            
            if (typeof msg.content?.content === 'string') {
              textContent = msg.content.content;
              const preview = textContent?.substring(0, Math.min(50, textContent?.length || 0)) || '';
              console.log('✅ Extracted text from reply.content.content:', preview);
            } else if (typeof msg.contentFallback === 'string') {
              // Try fallback content
              textContent = msg.contentFallback;
              const preview = textContent?.substring(0, Math.min(50, textContent?.length || 0)) || '';
              console.log('✅ Extracted text from contentFallback:', preview);
            } else {
              console.log('❌ Reply has no extractable text content');
            }
          }
          // Direct text content (regular messages)
          else if (typeof msg.content === 'string') {
            textContent = msg.content;
          }
          // Filter out non-text/non-transaction/non-reply content types
          else {
            console.log('Filtering out unknown message type:', msg.contentType?.typeId || 'unknown');
          }
          
          if (!textContent) return null;
          
          // Normalize timestamp to Date object
          let normalizedTimestamp: Date;
          const rawTimestamp = msg.sent || msg.sentAt;
          if (rawTimestamp instanceof Date) {
            normalizedTimestamp = rawTimestamp;
          } else if (typeof rawTimestamp === 'number') {
            normalizedTimestamp = new Date(rawTimestamp);
          } else if (rawTimestamp && typeof rawTimestamp === 'object' && 'toDate' in rawTimestamp) {
            normalizedTimestamp = (rawTimestamp as any).toDate();
          } else {
            normalizedTimestamp = new Date();
          }
          
          return {
            id: msg.id,
            content: textContent,
            senderInboxId: msg.senderAddress || msg.senderInboxId,
            sentAt: normalizedTimestamp,
            contentType: messageType,
            transaction: transactionData,
          };
        })
        .filter((msg: Message | null): msg is Message => msg !== null);
      
      console.log(`Displaying ${normalizedMessages.length} messages (text + transactions)`);
      setMessages(normalizedMessages as Message[]);
    } catch (err) {
      console.error('Failed to refresh messages:', err);
    } finally {
      isSyncing.current = false;
    }
  }, [conversation, client]);

  const sendMessage = async (content: string) => {
    if (!conversation || !client) {
      throw new Error('No active conversation');
    }

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 SENDING MESSAGE TO POCKI 🎋');
      console.log('Time:', new Date().toLocaleTimeString());
      console.log('Message:', content);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // CRITICAL: Sync conversation before sending to prevent "Group is inactive" error
      console.log('🔄 Syncing conversation state before sending...');
      await (conversation as any).sync();
      
      // Check if conversation is still active
      const isActive = await (conversation as any).isActive();
      console.log('📊 Conversation active status:', isActive);
      
      if (!isActive) {
        throw new Error('Conversation is inactive. Please refresh and try again.');
      }
      
      const peerInboxId = await (conversation as any).peerInboxId();
      console.log('📋 Target conversation:', {
        id: conversation.id,
        peerInboxId,
        expectedAgentInboxId: AGENT_ADDRESS,
        isCorrectPeer: peerInboxId === AGENT_ADDRESS,
      });
      
      const messageId = await conversation.send(content);
      console.log('✅ Message sent successfully! ID:', messageId);
      console.log('⏳ Waiting for Pocki to respond...');
      
      // Show typing indicator while waiting for Pocki's response
      setIsAgentTyping(true);
      
      // Immediately add optimistic message to UI with the actual message ID
      if (messageId) {
        const optimisticMessage: Message = {
          id: messageId,
          content,
          senderInboxId: client.inboxId,
          sentAt: new Date(),
        };
        setMessages(prev => {
          // Check if message already exists (from stream)
          const exists = prev.some(m => m.id === messageId);
          if (exists) return prev;
          return [...prev, optimisticMessage];
        });
      }
      
      // Clear any existing auto-sync timeout
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }
      
      // Wait 5 seconds for agent to respond, then sync
      autoSyncTimeoutRef.current = setTimeout(async () => {
        console.log('🔄 Auto-syncing to fetch agent response...');
        await refreshMessages();
        autoSyncTimeoutRef.current = null;
      }, 5000);
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      throw err;
    }
  };

  const forceSyncAll = async () => {
    if (!client) return;
    console.log('🔄 Force syncing all conversations (including all consent states)...');
    await (client.conversations as any).syncAll(['allowed', 'unknown', 'denied']);
    const allConvs = await (client.conversations as any).list();
    setAllConversations(allConvs);
    console.log(`✅ Synced! Total conversations: ${allConvs.length}`);
    
    // CRITICAL: Refresh the conversation object after sync to prevent stale reference
    // This fixes "message failed to send" errors after force sync
    console.log('🔄 Refreshing active conversation object...');
    const refreshedConv = await (client.conversations as any).getDmByInboxId(AGENT_ADDRESS);
    if (refreshedConv) {
      console.log('✅ Refreshed conversation object');
      setConversation(refreshedConv);
      const peerInboxId = await refreshedConv.peerInboxId();
      setConversationPeerInboxId(peerInboxId);
      
      // Load messages directly from refreshed conversation to avoid closure stale reference
      const { ContentTypeWalletSendCalls } = await import('@xmtp/content-type-wallet-send-calls');
      const { ContentTypeReply } = await import('@xmtp/content-type-reply');
      const updatedMessages = await refreshedConv.messages();
      console.log(`Fetched ${updatedMessages.length} total messages from refreshed conversation`);
      
      const normalizedMessages = updatedMessages
        .map((msg: any) => {
          let textContent: string | null = null;
          let messageType: 'text' | 'transaction' = 'text';
          let transactionData: any = null;
          
          if (msg.contentType && msg.contentType.sameAs(ContentTypeWalletSendCalls)) {
            messageType = 'transaction';
            transactionData = msg.content;
            textContent = msg.contentFallback || 'Transaction Request';
          } else if (msg.contentType && msg.contentType.sameAs(ContentTypeReply)) {
            if (typeof msg.content?.content === 'string') {
              textContent = msg.content.content;
            } else if (typeof msg.contentFallback === 'string') {
              textContent = msg.contentFallback;
            }
          } else if (typeof msg.content === 'string') {
            textContent = msg.content;
          }
          
          if (!textContent) return null;
          
          // Normalize timestamp to Date object
          let normalizedTimestamp: Date;
          const rawTimestamp = msg.sent || msg.sentAt;
          if (rawTimestamp instanceof Date) {
            normalizedTimestamp = rawTimestamp;
          } else if (typeof rawTimestamp === 'number') {
            normalizedTimestamp = new Date(rawTimestamp);
          } else if (rawTimestamp && typeof rawTimestamp === 'object' && 'toDate' in rawTimestamp) {
            normalizedTimestamp = (rawTimestamp as any).toDate();
          } else {
            normalizedTimestamp = new Date();
          }
          
          return {
            id: msg.id,
            content: textContent,
            senderInboxId: msg.senderAddress || msg.senderInboxId,
            sentAt: normalizedTimestamp,
            contentType: messageType,
            transaction: transactionData,
          };
        })
        .filter((msg: any): msg is Message => msg !== null);
      
      setMessages(normalizedMessages);
      console.log(`✅ Force sync complete! Loaded ${normalizedMessages.length} messages`);
    } else {
      console.warn('⚠️ Could not find conversation after sync');
    }
  };

  const fixConversation = async () => {
    if (!client) return;
    
    console.log('🔧 Fixing conversation - Finding or creating correct DM with agent...');
    console.log('🎯 Target agent inbox ID:', AGENT_ADDRESS);
    
    // Sync first (including all consent states)
    await (client.conversations as any).syncAll(['allowed', 'unknown', 'denied']);
    
    // List all conversations to debug
    const allConvs = await (client.conversations as any).list();
    console.log(`📋 Total conversations found: ${allConvs.length}`);
    for (const [idx, c] of allConvs.entries()) {
      const peerInboxId = await c.peerInboxId();
      console.log(`  Conversation ${idx + 1}:`, {
        id: c.id,
        peerInboxId,
        createdAt: c.createdAt,
        matchesTarget: peerInboxId === AGENT_ADDRESS,
      });
    }
    
    // Try to get the correct DM by inbox ID
    let correctConv = await (client.conversations as any).getDmByInboxId(AGENT_ADDRESS);
    
    if (!correctConv) {
      console.log('⚠️ No DM found with target inbox ID, creating new one...');
      correctConv = await (client.conversations as any).newDm(AGENT_ADDRESS);
      console.log('✅ Created new DM');
      const newPeerInboxId = await correctConv.peerInboxId();
      console.log('📋 New conversation peer inbox ID:', newPeerInboxId);
      
      // Sync again after creating (including all consent states)
      await (client.conversations as any).syncAll(['allowed', 'unknown', 'denied']);
    } else {
      console.log('✅ Found existing DM with target inbox ID');
      const existingPeerInboxId = await correctConv.peerInboxId();
      console.log('📋 Conversation peer inbox ID:', existingPeerInboxId);
      console.log('📋 Conversation ID:', correctConv.id);
    }
    
    // Verify it matches
    const finalPeerInboxId = await correctConv.peerInboxId();
    if (finalPeerInboxId !== AGENT_ADDRESS) {
      console.error('❌ ERROR: Found conversation peerInboxId does NOT match target!');
      console.error('  Expected:', AGENT_ADDRESS);
      console.error('  Got:', finalPeerInboxId);
    } else {
      console.log('✅ VERIFIED: Conversation peerInboxId matches target!');
    }
    
    // Update conversation
    setConversation(correctConv);
    
    // Refresh conversation list
    const updatedConvs = await (client.conversations as any).list();
    setAllConversations(updatedConvs);
    
    // Load messages from correct conversation
    const messages = await correctConv.messages();
    const normalizedMessages = messages
      .map((msg: any) => {
        let textContent: string | null = null;
        
        if (typeof msg.content === 'string') {
          textContent = msg.content;
        } else if (msg.contentType?.typeId === 'reply') {
          if (typeof msg.content?.content === 'string') {
            textContent = msg.content.content;
          } else if (typeof msg.contentFallback === 'string') {
            textContent = msg.contentFallback;
          }
        }
        
        return textContent ? {
          id: msg.id,
          content: textContent,
          senderInboxId: msg.senderInboxId,
          sentAt: msg.sentAt,
        } : null;
      })
      .filter(Boolean) as Message[];
    
    setMessages(normalizedMessages);
    console.log(`✅ Fixed! Loaded ${normalizedMessages.length} messages from correct conversation`);
  };

  // Cleanup: Clear auto-sync timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
        autoSyncTimeoutRef.current = null;
      }
    };
  }, []);

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
        refreshMessages,
        activeWalletAddress,
        debugInfo: {
          clientInboxId: client?.inboxId || null,
          conversationId: conversation?.id || null,
          conversationPeerInboxId,
          targetAgentInboxId: AGENT_ADDRESS,
          allConversations,
        },
        forceSyncAll,
        fixConversation,
      }}
    >
      {children}
    </XMTPContext.Provider>
  );
}

export const useXMTP = () => useContext(XMTPContext);
