'use client';

import { useState } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, type Address } from 'viem';

interface TransactionCall {
  to: Address;
  value?: string;
  data?: `0x${string}`;
  metadata?: {
    description?: string;
    transactionType?: string;
    amount?: string;
    currency?: string;
    decimals?: number;
  };
}

interface XMTPWalletSendCallsParams {
  version: string;
  from: Address;
  chainId: string;
  calls: TransactionCall[];
}

interface LegacyTransactionRequest {
  type: 'transfer' | 'approve' | 'swap';
  to: Address;
  amount: string;
  token?: Address;
  data?: `0x${string}`;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: XMTPWalletSendCallsParams | LegacyTransactionRequest | null;
}

interface CallResult {
  hash?: `0x${string}`;
  error?: string;
  confirmed?: boolean;
  confirming?: boolean;
}

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const { address, chainId: currentChainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentCallIndex, setCurrentCallIndex] = useState<number>(-1);
  const [callResults, setCallResults] = useState<CallResult[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const isXMTPFormat = 'calls' in transaction && 'version' in transaction;
  
  const handleConfirm = async () => {
    if (!transaction || !address || !publicClient) return;

    setIsExecuting(true);
    setGlobalError(null);

    if (isXMTPFormat) {
      const xmtpTx = transaction as XMTPWalletSendCallsParams;
      
      if (xmtpTx.from.toLowerCase() !== address.toLowerCase()) {
        setGlobalError(`Transaction requires wallet ${xmtpTx.from.slice(0, 6)}...${xmtpTx.from.slice(-4)}, but you're connected with ${address.slice(0, 6)}...${address.slice(-4)}`);
        setIsExecuting(false);
        return;
      }
      
      const targetChainId = parseInt(xmtpTx.chainId, 16);
      if (currentChainId !== targetChainId) {
        setGlobalError(`Please switch to chain ${targetChainId} (Base). Currently on chain ${currentChainId}`);
        setIsExecuting(false);
        return;
      }

      if (xmtpTx.calls.length === 0) {
        setGlobalError('No transaction calls to execute');
        setIsExecuting(false);
        return;
      }

      const results: CallResult[] = new Array(xmtpTx.calls.length).fill({});
      setCallResults(results);

      for (let i = 0; i < xmtpTx.calls.length; i++) {
        setCurrentCallIndex(i);
        const call = xmtpTx.calls[i];
        
        try {
          console.log(`Executing call ${i + 1}/${xmtpTx.calls.length}:`, call);
          
          const hash = await sendTransactionAsync({
            to: call.to as Address,
            value: call.value ? BigInt(call.value) : undefined,
            data: call.data,
          });

          console.log(`Call ${i + 1} hash:`, hash);
          results[i] = { hash, confirming: true };
          setCallResults([...results]);

          console.log(`Waiting for confirmation of call ${i + 1}...`);
          
          const receipt = await publicClient.waitForTransactionReceipt({ 
            hash,
            confirmations: 1,
          });

          if (receipt.status === 'reverted') {
            throw new Error('Transaction reverted on-chain');
          }

          console.log(`Call ${i + 1} confirmed:`, receipt.transactionHash);
          results[i] = { hash, confirmed: true };
          setCallResults([...results]);
          
        } catch (err: any) {
          console.error(`Failed to execute call ${i + 1}:`, err);
          results[i] = { ...results[i], error: err.message || 'Transaction failed', confirming: false };
          setCallResults([...results]);
          setGlobalError(`Call ${i + 1} failed: ${err.message || 'Transaction rejected'}`);
          setIsExecuting(false);
          setCurrentCallIndex(-1);
          return;
        }
      }

      setCurrentCallIndex(-1);
      setIsExecuting(false);
      console.log('All calls executed and confirmed successfully');
    } else {
      const legacyTx = transaction as LegacyTransactionRequest;
      
      try {
        const hash = await sendTransactionAsync({
          to: legacyTx.to,
          value: legacyTx.type === 'transfer' ? parseEther(legacyTx.amount) : undefined,
          data: legacyTx.data,
        });
        
        setCallResults([{ hash, confirming: true }]);
        
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash,
          confirmations: 1,
        });

        if (receipt.status === 'reverted') {
          throw new Error('Transaction reverted on-chain');
        }

        setCallResults([{ hash, confirmed: true }]);
        setIsExecuting(false);
      } catch (err: any) {
        setGlobalError(err.message || 'Transaction failed');
        setCallResults([{ error: err.message }]);
        setIsExecuting(false);
      }
    }
  };

  const renderTransactionDetails = () => {
    if (isXMTPFormat) {
      const xmtpTx = transaction as XMTPWalletSendCallsParams;
      const chainIdDecimal = parseInt(xmtpTx.chainId, 16);
      
      return (
        <div className="bg-panda-green-50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">From:</span>
            <span className="font-mono text-sm">{xmtpTx.from.slice(0, 6)}...{xmtpTx.from.slice(-4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Chain:</span>
            <span className="font-semibold">{chainIdDecimal === 8453 ? 'Base' : `Chain ${chainIdDecimal}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Calls:</span>
            <span className="font-semibold">{xmtpTx.calls.length} transaction{xmtpTx.calls.length > 1 ? 's' : ''}</span>
          </div>
          
          <div className="mt-4 space-y-2">
            {xmtpTx.calls.map((call, idx) => {
              const result = callResults[idx];
              const isExecuting = currentCallIndex === idx && !result?.confirmed;
              const isConfirming = result?.confirming && !result?.confirmed;
              const isConfirmed = result?.confirmed;
              const hasError = result?.error;
              
              return (
                <div 
                  key={idx} 
                  className={`bg-white rounded-lg p-3 border ${
                    isExecuting || isConfirming ? 'border-panda-green-500 border-2' : 
                    isConfirmed ? 'border-green-500' :
                    hasError ? 'border-red-500' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm mb-1">
                      {call.metadata?.description || `Transaction ${idx + 1}`}
                    </div>
                    {isExecuting && !result?.hash && <span className="text-xs text-panda-green-600">⏳ Signing...</span>}
                    {isConfirming && <span className="text-xs text-yellow-600">⏳ Confirming...</span>}
                    {isConfirmed && <span className="text-xs text-green-600">✅</span>}
                    {hasError && <span className="text-xs text-red-600">❌</span>}
                  </div>
                  {call.metadata?.transactionType && (
                    <div className="text-xs text-gray-600">
                      Type: {call.metadata.transactionType}
                    </div>
                  )}
                  {call.metadata?.amount && call.metadata?.currency && (
                    <div className="text-xs text-gray-600">
                      Amount: {call.metadata.amount} {call.metadata.currency}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 font-mono mt-1">
                    To: {call.to.slice(0, 6)}...{call.to.slice(-4)}
                  </div>
                  {result?.hash && (
                    <div className="text-xs text-green-600 font-mono mt-1">
                      Hash: {result.hash.slice(0, 10)}...{result.hash.slice(-8)}
                    </div>
                  )}
                  {result?.error && (
                    <div className="text-xs text-red-600 mt-1">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      const legacyTx = transaction as LegacyTransactionRequest;
      const result = callResults[0];
      
      return (
        <div className="bg-panda-green-50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-semibold capitalize">{legacyTx.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">To:</span>
            <span className="font-mono text-sm">{legacyTx.to.slice(0, 6)}...{legacyTx.to.slice(-4)}</span>
          </div>
          {legacyTx.amount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">{legacyTx.amount} ETH</span>
            </div>
          )}
          {result?.hash && (
            <div className="mt-2">
              <div className="text-xs font-mono text-gray-600">
                Hash: {result.hash.slice(0, 10)}...{result.hash.slice(-8)}
              </div>
              {result.confirming && !result.confirmed && (
                <div className="text-xs text-yellow-600 mt-1">⏳ Confirming...</div>
              )}
              {result.confirmed && (
                <div className="text-xs text-green-600 mt-1">✅ Confirmed</div>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  const allCallsCompleted = isXMTPFormat 
    ? callResults.length === (transaction as XMTPWalletSendCallsParams).calls.length && 
      callResults.every(r => r.confirmed)
    : callResults[0]?.confirmed;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🐼</div>
          <h2 className="text-2xl font-bold text-gray-900">Confirm Transaction</h2>
        </div>

        {renderTransactionDetails()}

        {globalError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{globalError}</p>
          </div>
        )}

        {allCallsCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-700 text-sm font-semibold">
              ✅ All transactions confirmed on-chain!
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              setCallResults([]);
              setCurrentCallIndex(-1);
              setGlobalError(null);
            }}
            disabled={isExecuting}
            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {allCallsCompleted ? 'Close' : 'Cancel'}
          </button>
          {!allCallsCompleted && (
            <button
              onClick={handleConfirm}
              disabled={isExecuting}
              className="flex-1 bg-panda-green-600 hover:bg-panda-green-700 disabled:bg-panda-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isExecuting ? 'Processing...' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
