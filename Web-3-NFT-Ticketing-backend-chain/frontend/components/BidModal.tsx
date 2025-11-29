'use client';

import { useState } from 'react';

interface BidModalProps {
  eventId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const BidModal = ({ eventId, onClose, onSuccess }: BidModalProps) => {
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Please enter a valid positive price.');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('nft-ticket-auth-token');
    if (!token) {
      setError('You must be logged in to place a bid.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/market/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: eventId,
          price: numericPrice,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to place bid.');
      }

      onSuccess();

    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError('An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Place Bid for Event #{eventId}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
              Your Bid Price (in ETH/USD, etc.)
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 0.45"
              step="0.01"
              min="0.000001"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BidModal;
