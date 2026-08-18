import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserAddresses, addAddress as addAddressToDb, deleteAddress as deleteAddressFromDb, updateAddressLabel as updateAddressLabelInDb, getUserPreferences, updateUserPreferences } from '../services/userApi';
import { getPortfolio, getPortfolioMultiAddress } from '../services/api';
import { mergeWalletPortfolios, reconcilePortfolios } from '../utils/walletMerge';
import { loadPortfolioCache, savePortfolioCache, clearPortfolioCache } from '../utils/portfolioCache';
import { formatCurrency } from '../utils/currency';
import WalletManager from '../components/WalletManager';
import WalletWidget from '../components/WalletWidget';
import PortfolioDashboard from '../components/PortfolioDashboard';
import AssetList from '../components/AssetList';
import CurrencySelector from '../components/CurrencySelector';
import CopyButton from '../components/CopyButton';
import { Loader2, Globe, Minimize2, SearchX, AlertTriangle } from 'lucide-react';

/**
 * Monta o aviso de sincronização parcial a partir do que a API reportou como
 * indisponível. Retorna null quando a sincronização veio completa.
 */
function buildSyncWarning(portfolio, fetchedWallets) {
  const failedWallets = fetchedWallets.filter(w => w.error);
  const degraded = portfolio?.degraded || {};
  const staleChains = [...new Set(degraded.staleChains || [])];
  const failedChains = [...new Set(degraded.failedChains || [])];
  const partialChains = [...new Set(degraded.partialChains || [])];
  const parts = [];

  if (failedWallets.length > 0) {
    parts.push(
      failedWallets.length === 1
        ? '1 carteira não respondeu'
        : `${failedWallets.length} carteiras não responderam`
    );
  }

  if (staleChains.length > 0) {
    parts.push(`saldo de ${staleChains.join(', ')} é do último valor conhecido`);
  } else if (failedChains.length > 0) {
    parts.push(`${failedChains.join(', ')} não respondeu`);
  }

  if (partialChains.length > 0) {
    parts.push(`alguns tokens de ${partialChains.join(', ')} não puderam ser lidos`);
  }

  if (degraded.missingPrices) {
    parts.push('alguns preços estão indisponíveis');
  } else if (degraded.stalePrices) {
    parts.push('preços vindos do cache');
  }

  if (parts.length === 0) return null;
  return `Sincronização parcial: ${parts.join('; ')}.`;
}

function Dashboard() {
  const { user, token, logout } = useAuth();
  const userId = user?.id;

  // Saldo da última sessão: aparece na hora, antes de a sincronização terminar
  const cachedEntry = useRef(loadPortfolioCache(userId)).current;

  const [wallets, setWallets] = useState([]);
  const [mergedPortfolio, setMergedPortfolio] = useState(cachedEntry?.portfolio || null);
  const [lastUpdated, setLastUpdated] = useState(cachedEntry?.updatedAt || null);
  const [syncWarning, setSyncWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('BRL');
  const [selectedChain, setSelectedChain] = useState(null);
  const [isWalletManagerExpanded, setIsWalletManagerExpanded] = useState(false);
  const hasAutoFetched = useRef(false);
  // Descarta respostas de sincronizações antigas que chegam fora de ordem
  const fetchIdRef = useRef(0);
  const portfolioRef = useRef(mergedPortfolio);

  portfolioRef.current = mergedPortfolio;

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

      // Sem carteiras não existe saldo para exibir: o cache antigo seria mentira
      if (walletsFromDb.length === 0) {
        clearPortfolioCache(userId);
        setMergedPortfolio(null);
        setLastUpdated(null);
      }
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
      const remaining = wallets.filter(w => w.id !== id);
      setWallets(remaining);

      if (remaining.length === 0) {
        clearPortfolioCache(userId);
        setMergedPortfolio(null);
        setLastUpdated(null);
        setSyncWarning(null);
      }
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
    const walletsToFetch = wallets;
    if (walletsToFetch.length === 0) return;

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setSyncWarning(null);

    const idsToFetch = new Set(walletsToFetch.map(w => w.id));
    setWallets(prev => prev.map(w => (idsToFetch.has(w.id) ? { ...w, loading: true, error: null } : w)));

    try {
      const results = await Promise.all(
        walletsToFetch.map(async (wallet) => {
          try {
            const portfolioData = wallet.type === 'bitcoin'
              ? await getPortfolioMultiAddress(null, wallet.address)
              : await getPortfolio(wallet.address);
            return { ...wallet, portfolioData, loading: false, error: null };
          } catch (error) {
            console.error(`Error fetching portfolio for ${wallet.address}:`, error);
            return { ...wallet, loading: false, error: error.message };
          }
        })
      );

      // Resposta atrasada: uma sincronização mais nova já assumiu
      if (fetchId !== fetchIdRef.current) return;

      // Preserva carteiras adicionadas ou removidas durante a busca
      const resultById = new Map(results.map(w => [w.id, w]));
      setWallets(prev => prev.map(w => resultById.get(w.id) || w));

      const merged = mergeWalletPortfolios(results);

      if (!merged) {
        // Nenhuma carteira respondeu: mantém o último saldo bom em vez de sumir
        setSyncWarning(
          portfolioRef.current
            ? 'Não foi possível sincronizar agora. Exibindo o último saldo conhecido.'
            : 'Não foi possível sincronizar as carteiras. Tente novamente.'
        );
        return;
      }

      // Repõe, a partir do saldo anterior, apenas as redes que falharam agora
      const reconciled = reconcilePortfolios(portfolioRef.current, merged);
      setMergedPortfolio(reconciled);

      const savedAt = savePortfolioCache(userId, reconciled);
      setLastUpdated(savedAt);
      setSyncWarning(buildSyncWarning(reconciled, results));
      setIsWalletManagerExpanded(false);
    } catch (error) {
      console.error('Error in batch fetch:', error);
      if (fetchId === fetchIdRef.current) {
        setSyncWarning('Erro ao sincronizar. Exibindo o último saldo conhecido.');
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    handleFetchAll();
  };

  // Com saldo em cache a sincronização roda em segundo plano, sem tela de espera
  if (loading && !mergedPortfolio) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center gap-6 fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 rounded-full animate-pulse-slow"></div>
          <Loader2 className="w-16 h-16 text-primary-500 animate-spin relative z-10" />
        </div>
        <div className="text-center">
          <p className="text-gray-200 font-medium text-lg">Sincronizando blockchains...</p>
          <p className="text-gray-500 text-sm mt-1">Isso pode levar alguns segundos dependendo das redes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <header className="mb-8 fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Visão Geral
            </h1>
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
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-gray-400 font-medium">Suas Carteiras:</span>
              <div className="flex flex-wrap gap-2">
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="flex items-center gap-2 bg-dark-800/60 border border-white/5 rounded-full px-3 py-1.5 backdrop-blur-sm transition-all hover:border-white/10 hover:bg-dark-700/60 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-gray-300 font-mono text-xs">
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
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-100">Gerenciar Wallets</h2>
                <button
                  onClick={() => setIsWalletManagerExpanded(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  title="Minimizar"
                >
                  <Minimize2 className="w-5 h-5" />
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

        {syncWarning && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <span>{syncWarning}</span>
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
              lastUpdated={lastUpdated}
            />

            <div>
              {/* Chain Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {/* 'All' Card */}
                <div
                  onClick={() => setSelectedChain(null)}
                  className={`
                    card-glass p-4 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group
                    ${!selectedChain ? 'ring-2 ring-primary-500/50 bg-primary-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className={`w-5 h-5 ${!selectedChain ? 'text-primary-400' : 'text-gray-400 group-hover:text-gray-300'}`} />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rede Global</span>
                  </div>
                  <div className="text-xl font-bold text-white mb-1">
                    {formatCurrency(
                      currency === 'BRL' ? mergedPortfolio.totalValueBRL : currency === 'USD' ? mergedPortfolio.totalValueUSD : mergedPortfolio.totalValueBTC,
                      currency
                    )}
                  </div>
                  <div className="text-xs text-primary-400 font-medium bg-primary-500/10 px-2 py-0.5 rounded-full inline-block">
                    100% do Portfólio
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

                  const nativeToken = chain.assets.find(a =>
                    a.isNative === true ||
                    a.symbol === nativeSymbol ||
                    (nativeSymbol === 'ETH' && (a.symbol === 'ETH' || a.symbol === 'Ether' || a.name === 'Ethereum')) ||
                    (nativeSymbol === 'MATIC' && (a.symbol === 'MATIC' || a.symbol === 'POL' || a.name === 'Polygon')) ||
                    (nativeSymbol === 'BNB' && (a.symbol === 'BNB' || a.name === 'BNB'))
                  );

                  const nativeBalance = nativeToken ? parseFloat(nativeToken.balance) : 0;
                  const displaySymbol = nativeToken?.symbol || nativeSymbol;

                  return (
                    <div
                      key={chain.chainId}
                      onClick={() => setSelectedChain(isSelected ? null : chain.chain)}
                      className={`
                        card-glass p-4 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group
                        ${isSelected ? 'ring-2 ring-primary-500/50 bg-primary-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'border-transparent'}
                      `}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl filter drop-shadow-md">{chainIcons[chain.chain] || chainIcons[chain.name] || '⚪'}</span>
                        <span className="text-xs font-semibold text-gray-300 truncate tracking-wide">{chain.chain}</span>
                      </div>
                      <div className="text-xl font-bold text-white mb-1 whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                        {formatCurrency(chainValue, currency)}
                      </div>
                      {nativeToken && nativeBalance > 0 && (
                        <div className="text-xs text-gray-400 font-medium mb-1.5 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                          {nativeBalance.toFixed(4)} {displaySymbol}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 font-medium bg-dark-800/50 border border-white/5 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        {chain.assets.length} ativos
                        <span className="text-primary-400 ml-1">({percentage.toFixed(0)}%)</span>
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
          <div className="text-center py-16 card-glass max-w-2xl mx-auto mt-12 border-dashed border-white/10">
            <div className="w-16 h-16 bg-dark-800/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
              <SearchX className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-white">Nenhum dado de portfólio</h3>
            <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
              Clique em "Buscar Portfólio" para sincronizar e carregar os saldos das suas carteiras conectadas.
            </p>
            <button 
              onClick={handleFetchAll}
              className="mt-6 btn-primary mx-auto"
            >
              Sincronizar Agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
