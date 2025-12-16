import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserAddresses, addAddress as addAddressToDb, deleteAddress as deleteAddressFromDb, updateAddressLabel as updateAddressLabelInDb, getUserPreferences, updateUserPreferences } from '../services/userApi';
import { getPortfolio } from '../services/api';
import { mergeWalletPortfolios } from '../utils/walletMerge';
import WalletManager from '../components/WalletManager';
import WalletWidget from '../components/WalletWidget';
import PortfolioDashboard from '../components/PortfolioDashboard';
import ChainSection from '../components/ChainSection';
import CurrencySelector from '../components/CurrencySelector';

function Dashboard() {
  const { user, token, logout } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [mergedPortfolio, setMergedPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('BRL');
  const [isWalletManagerExpanded, setIsWalletManagerExpanded] = useState(true);
  const hasAutoFetched = useRef(false);

  // Load user's wallets and preferences from database on mount
  useEffect(() => {
    if (token) {
      loadUserAddresses();
      loadUserPreferences();
    }
  }, [token]);

  // Auto-fetch portfolio after wallets are loaded
  useEffect(() => {
    if (wallets.length > 0 && !hasAutoFetched.current && !loading) {
      hasAutoFetched.current = true;
      handleFetchAll();
    }
  }, [wallets.length]);

  async function loadUserAddresses() {
    try {
      const addresses = await getUserAddresses(token);
      const walletsFromDb = addresses.map(addr => ({
        id: addr.id.toString(),
        label: addr.label,
        address: addr.address,
        type: addr.type,
        portfolioData: null,
        loading: false,
        error: null
      }));
      setWallets(walletsFromDb);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  }

  async function loadUserPreferences() {
    try {
      const preferences = await getUserPreferences(token);
      if (preferences.default_currency) {
        setCurrency(preferences.default_currency);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  const handleCurrencyChange = async (newCurrency) => {
    setCurrency(newCurrency);
    try {
      await updateUserPreferences(token, { default_currency: newCurrency });
    } catch (error) {
      console.error('Failed to save currency preference:', error);
    }
  };

  const handleWalletsChange = async (newWallets) => {
    setWallets(newWallets);
  };

  const handleAddWalletToDb = async (label, address, type) => {
    try {
      const newAddress = await addAddressToDb(token, label, address, type);
      const newWallet = {
        id: newAddress.id.toString(),
        label: newAddress.label,
        address: newAddress.address,
        type: newAddress.type,
        portfolioData: null,
        loading: false,
        error: null
      };
      setWallets(prev => [...prev, newWallet]);
      return newWallet;
    } catch (error) {
      console.error('Failed to add address:', error);
      throw error;
    }
  };

  const handleRemoveWalletFromDb = async (id) => {
    try {
      await deleteAddressFromDb(token, id);
      setWallets(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw error;
    }
  };

  const handleUpdateWalletLabel = async (id, newLabel) => {
    try {
      await updateAddressLabelInDb(token, id, newLabel);
      setWallets(prev => prev.map(w => w.id === id ? { ...w, label: newLabel } : w));
    } catch (error) {
      console.error('Failed to update label:', error);
      throw error;
    }
  };

  const handleFetchAll = async () => {
    setLoading(true);

    const updatedWallets = wallets.map(w => ({ ...w, loading: true, error: null }));
    setWallets(updatedWallets);

    try {
      const fetchPromises = wallets.map(async (wallet) => {
        try {
          const portfolioData = await getPortfolio(wallet.address);
          return { ...wallet, portfolioData, loading: false, error: null };
        } catch (error) {
          console.error(`Error fetching portfolio for ${wallet.address}:`, error);
          return { ...wallet, loading: false, error: error.message };
        }
      });

      const results = await Promise.all(fetchPromises);
      setWallets(results);

      const merged = mergeWalletPortfolios(results);
      setMergedPortfolio(merged);

      if (merged) {
        setIsWalletManagerExpanded(false);
      }
    } catch (error) {
      console.error('Error in batch fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    handleFetchAll();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Crypto Portfolio Tracker</h1>
            {!isWalletManagerExpanded && wallets.length > 0 && (
              <WalletWidget
                wallets={wallets}
                onExpand={() => setIsWalletManagerExpanded(true)}
                onAddWallet={() => setIsWalletManagerExpanded(true)}
              />
            )}
          </div>
          <div className="flex items-center gap-4">
            <CurrencySelector currency={currency} onCurrencyChange={handleCurrencyChange} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {isWalletManagerExpanded && (
          <div className="mb-8 fade-in">
            <WalletManager
              wallets={wallets}
              onWalletsChange={handleWalletsChange}
              onAddWallet={handleAddWalletToDb}
              onRemoveWallet={handleRemoveWalletFromDb}
              onUpdateLabel={handleUpdateWalletLabel}
              onFetchAll={handleFetchAll}
              loading={loading}
            />
          </div>
        )}

        {mergedPortfolio && (
          <div className="space-y-6 fade-in">
            <PortfolioDashboard
              data={mergedPortfolio}
              onRefresh={handleRefresh}
              loading={loading}
              currency={currency}
            />

            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Assets by Chain</h2>
              <div className="space-y-6">
                {mergedPortfolio.chains.map((chain) => (
                  <ChainSection
                    key={chain.chainId}
                    chain={chain}
                    currency={currency}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {!mergedPortfolio && !loading && wallets.length > 0 && (
          <div className="text-center py-12 card">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No portfolio data</h3>
            <p className="mt-1 text-sm text-gray-500">Click "Buscar Portfólio" to fetch your wallet data</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
