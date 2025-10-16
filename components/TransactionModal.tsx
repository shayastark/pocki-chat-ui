'use client';

import { useState } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';

interface TransactionRequest {
  type: 'transfer' | 'approve' | 'swap';
  to: Address;
  amount: string;
  token?: Address;
  data?: `0x${string}`;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRequest | null;
}

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const { address } = useAccount();
  const { data: hash, sendTransaction, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!isOpen || !transaction) return null;

  const handleConfirm = () => {
    if (!transaction || !address) return;

    sendTransaction({
      to: transaction.to,
      value: transaction.type === 'transfer' ? parseEther(transaction.amount) : undefined,
      data: transaction.data,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🐼</div>
          <h2 className="text-2xl font-bold text-gray-900">Confirm Transaction</h2>
        </div>

        <div className="bg-panda-green-50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-semibold capitalize">{transaction.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">To:</span>
            <span className="font-mono text-sm">{transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}</span>
          </div>
          {transaction.amount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">{transaction.amount} ETH</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">Error: {error.message}</p>
          </div>
        )}

        {hash && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-700 text-sm font-semibold mb-1">
              {isConfirming && '⏳ Confirming transaction...'}
              {isSuccess && '✅ Transaction confirmed!'}
            </p>
            <p className="text-xs text-gray-600 font-mono break-all">
              Hash: {hash}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending || isConfirming}
            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isSuccess ? 'Close' : 'Cancel'}
          </button>
          {!isSuccess && (
            <button
              onClick={handleConfirm}
              disabled={isPending || isConfirming}
              className="flex-1 bg-panda-green-600 hover:bg-panda-green-700 disabled:bg-panda-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isPending || isConfirming ? 'Processing...' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
