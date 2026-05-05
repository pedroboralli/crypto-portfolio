import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserAddresses, addAddress as addAddressToDb, deleteAddress as deleteAddressFromDb, updateAddressLabel as updateAddressLabelInDb, getUserPreferences, updateUserPreferences } from '../services/userApi';
import { getPortfolio } from '../services/api';
import { mergeWalletPortfolios } from '../utils/walletMerge';
import { formatCurrency } from '../utils/currency';
import WalletManager from '../components/WalletManager';
import WalletWidget from '../components/WalletWidget';
import PortfolioDashboard from '../components/PortfolioDashboard';
import AssetList from '../components/AssetList';
import CurrencySelector from '../components/CurrencySelector';
import CopyButton from '../components/CopyButton';

function Dashboard() {
  const { user, token, logout } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [mergedPortfolio, setMergedPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('BRL');
  const [selectedChain, setSelectedChain] = useState(null);
  const [isWalletManagerExpanded, setIsWalletManagerExpanded] = useState(false);
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

  if (loading && !mergedPortfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Meu Portfólio</h1>
            <div className="flex items-center gap-4">
              <CurrencySelector currency={currency} onCurrencyChange={handleCurrencyChange} />
              {!isWalletManagerExpanded && (
                <WalletWidget
                  wallets={wallets}
                  onExpand={() => setIsWalletManagerExpanded(true)}
                  onAddWallet={() => setIsWalletManagerExpanded(true)}
                />
              )}
            </div>
          </div>

          {/* Wallet Addresses Display */}
          {!isWalletManagerExpanded && wallets.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Wallets:</span>
              <div className="flex flex-wrap gap-2">
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
                    <span className="text-gray-700 font-mono text-xs">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                    <CopyButton text={wallet.address} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        {isWalletManagerExpanded && (
          <div className="mb-8 fade-in">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Gerenciar Wallets</h2>
                <button
                  onClick={() => setIsWalletManagerExpanded(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Minimizar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
          </div>
        )}

        {mergedPortfolio && (
          <div className="space-y-6 fade-in">
            {/* Portfolio Dashboard always shows global total */}
            <PortfolioDashboard
              data={mergedPortfolio}
              onRefresh={handleRefresh}
              loading={loading}
              currency={currency}
            />

            <div>
              {/* Chain Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {/* 'All' Card */}
                <div
                  onClick={() => setSelectedChain(null)}
                  className={`
                    bg-white rounded-lg shadow p-3 cursor-pointer transition-all
                    ${!selectedChain ? 'ring-2 ring-blue-500 bg-blue-50 transform scale-[1.02]' : 'hover:shadow-md hover:scale-[1.01]'}
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🌐</span>
                    <span className="text-xs font-medium text-gray-700">Todos</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-0.5">
                    {formatCurrency(
                      currency === 'BRL' ? mergedPortfolio.totalValueBRL : currency === 'USD' ? mergedPortfolio.totalValueUSD : mergedPortfolio.totalValueBTC,
                      currency
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    (100%)
                  </div>
                </div>

                {mergedPortfolio.chains.map((chain) => {
                  const totalValue = currency === 'BRL' ? mergedPortfolio.totalValueBRL : currency === 'USD' ? mergedPortfolio.totalValueUSD : mergedPortfolio.totalValueBTC;
                  const chainValue = chain.assets.reduce((sum, asset) => {
                    const assetValue = currency === 'BRL' ? asset.valueBRL : currency === 'USD' ? asset.valueUSD : asset.valueBTC;
                    return sum + (assetValue || 0);
                  }, 0);
                  const percentage = totalValue > 0 ? (chainValue / totalValue) * 100 : 0;
                  const isSelected = selectedChain === chain.chain;

                  const chainIcons = {
                    'Arbitrum One': '🔵',
                    'Arbitrum': '🔵',
                    'Polygon': '🟣',
                    'BNB Chain': '🟡',
                    'Ethereum': '🔷'
                  };

                  // Find native token for each chain
                  const nativeTokenSymbols = {
                    'Ethereum': 'ETH',
                    'Arbitrum One': 'ETH',
                    'Arbitrum': 'ETH',
                    'Polygon': 'MATIC',
                    'POL': 'MATIC',
                    'BNB Chain': 'BNB',
                    'BSC': 'BNB'
                  };
                  const nativeSymbol = nativeTokenSymbols[chain.chain] || nativeTokenSymbols[chain.name] || 'ETH';

                  // Debug: log chain assets to see structure
                  console.log(`Chain ${chain.chain}/${chain.name} assets:`, chain.assets.map(a => ({ symbol: a.symbol, isNative: a.isNative, balance: a.balance })));

                  const nativeToken = chain.assets.find(a =>
                    a.isNative === true ||
                    a.symbol === nativeSymbol ||
                    (nativeSymbol === 'ETH' && (a.symbol === 'ETH' || a.symbol === 'Ether' || a.name === 'Ethereum')) ||
                    (nativeSymbol === 'MATIC' && (a.symbol === 'MATIC' || a.symbol === 'POL' || a.name === 'Polygon')) ||
                    (nativeSymbol === 'BNB' && (a.symbol === 'BNB' || a.name === 'BNB'))
                  );

                  console.log(`Native token for ${chain.chain}:`, nativeToken);

                  const nativeBalance = nativeToken ? parseFloat(nativeToken.balance) : 0;
                  const displaySymbol = nativeToken?.symbol || nativeSymbol;

                  return (
                    <div
                      key={chain.chainId}
                      onClick={() => setSelectedChain(isSelected ? null : chain.chain)}
                      className={`
                        bg-white rounded-lg shadow p-3 cursor-pointer transition-all
                        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 transform scale-[1.02]' : 'hover:shadow-md hover:scale-[1.01]'}
                      `}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{chainIcons[chain.chain] || chainIcons[chain.name] || '⚪'}</span>
                        <span className="text-xs font-medium text-gray-700 truncate">{chain.chain} ({chain.assets.length})</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 mb-0.5 whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                        {formatCurrency(chainValue, currency)}
                      </div>
                      {nativeToken && nativeBalance > 0 && (
                        <div className="text-xs text-blue-600 font-medium mb-0.5">
                          {nativeBalance.toFixed(4)} {displaySymbol}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Assets Table */}
              <AssetList
                chains={selectedChain
                  ? mergedPortfolio.chains.filter(c => c.chain === selectedChain)
                  : mergedPortfolio.chains
                }
                currency={currency}
                totalValue={currency === 'BRL' ? mergedPortfolio.totalValueBRL : currency === 'USD' ? mergedPortfolio.totalValueUSD : mergedPortfolio.totalValueBTC}
              />
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
