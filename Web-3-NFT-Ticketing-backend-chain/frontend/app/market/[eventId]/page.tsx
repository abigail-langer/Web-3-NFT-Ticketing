'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useParams } from 'next/navigation';
import BidModal from '@/components/BidModal';

interface Order {
  id: number;
  price: string;
  seller_address?: string;
  buyer_address?: string;
}

interface OrderBook {
  sells: Order[];
  buys: Order[];
}

interface AuthState {
  token: string;
  user: {
    id: number;
    wallet_address: string;
  };
}

const MarketPage = () => {
  const [orderBook, setOrderBook] = useState<OrderBook>({ sells: [], buys: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState | null>(null);

  const params = useParams();
  const eventId = params.eventId as string;
  const { address } = useAccount();

  const fetchOrderBook = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/market/orders/${eventId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch order book.');
      }
      const data = await res.json();
      setOrderBook(data);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError('An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    // Check for auth token on load
    const token = localStorage.getItem('nft-ticket-auth-token');
    if (token) {
        // A simplified version of the main page's auth logic
        // In a real app, you'd use a global state (Context/Redux/Zustand)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setAuthState({ token, user: { id: payload.id, wallet_address: payload.address } });
    }

    if (eventId) {
      fetchOrderBook();
      const interval = setInterval(fetchOrderBook, 5000);
      return () => clearInterval(interval);
    }
  }, [eventId, fetchOrderBook]);

  const handleBidSuccess = () => {
    alert('Your bid has been placed!');
    setIsBidModalOpen(false);
    fetchOrderBook(); // Re-fetch data immediately
  };

  const handleBuyNow = async (sellOrder: Order) => {
    if (!authState) {
        alert('Please log in to buy a ticket.');
        return;
    }
    if (!confirm(`Are you sure you want to buy this ticket for ${sellOrder.price} ETH?`)) {
        return;
    }

    try {
        const res = await fetch('http://localhost:3001/api/market/execute_sell_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.token}`,
            },
            body: JSON.stringify({ sellOrderId: sellOrder.id }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Purchase failed.');
        }
        
        alert('Purchase successful!');
        fetchOrderBook(); // Refresh the order book

    } catch (e) {
        if (e instanceof Error) alert(e.message);
        else alert('An unknown error occurred during purchase.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Market for Event #{eventId}</h1>
          <button
            onClick={() => authState ? setIsBidModalOpen(true) : alert('Please log in to place a bid.')}
            disabled={!authState}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Place a Bid
          </button>
        </div>

        {loading && <p>Loading order book...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Asks / Sell Orders */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-red-400">Asks (Sellers)</h2>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-3 font-bold border-b border-gray-700 pb-2 mb-2">
                  <span>Price (ETH)</span>
                  <span>Seller</span>
                  <span>Action</span>
                </div>
                {orderBook.sells.length > 0 ? (
                  orderBook.sells.map(order => (
                    <div key={order.id} className="grid grid-cols-3 py-2 items-center">
                      <span>{parseFloat(order.price).toFixed(4)}</span>
                      <span className="font-mono text-sm">{order.seller_address?.slice(0, 8)}...</span>
                      <div>
                        {authState && authState.user.wallet_address.toLowerCase() !== order.seller_address?.toLowerCase() && (
                           <button 
                             onClick={() => handleBuyNow(order)}
                             className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg transition-colors"
                           >
                             Buy Now
                           </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4 col-span-3">No active sell orders.</p>
                )}
              </div>
            </div>

            {/* Bids / Buy Orders */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-green-400">Bids (Buyers)</h2>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 font-bold border-b border-gray-700 pb-2 mb-2">
                  <span>Price (ETH)</span>
                  <span>Buyer</span>
                </div>
                {orderBook.buys.length > 0 ? (
                  orderBook.buys.map(order => (
                    <div key={order.id} className="grid grid-cols-2 py-1">
                      <span>{parseFloat(order.price).toFixed(4)}</span>
                      <span className="font-mono text-sm">{order.buyer_address?.slice(0, 8)}...</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4 col-span-2">No active buy orders.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {isBidModalOpen && (
        <BidModal 
          eventId={parseInt(eventId)}
          onClose={() => setIsBidModalOpen(false)}
          onSuccess={handleBidSuccess}
        />
      )}
    </main>
  );
};

export default MarketPage;
