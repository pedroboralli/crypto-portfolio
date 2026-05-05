import axios from 'axios';

export function isValidBitcoinAddress(address) {
  const legacyRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const segwitRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Regex = /^(bc1)[a-z0-9]{39,59}$/;
  return legacyRegex.test(address) || segwitRegex.test(address) || bech32Regex.test(address);
}

export async function getBitcoinBalance(address) {
  if (!isValidBitcoinAddress(address)) {
    throw new Error('Invalid Bitcoin address');
  }

  try {
    const response = await axios.get('https://blockchain.info/balance', {
      params: { active: address },
      timeout: 8000,
    });

    const addressData = response.data[address];
    if (!addressData) throw new Error('Address not found');

    const balance = addressData.final_balance / 100000000;

    if (balance === 0) return { chain: 'Bitcoin', chainId: 'bitcoin', assets: [] };

    return {
      chain: 'Bitcoin',
      chainId: 'bitcoin',
      assets: [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          balance: balance.toString(),
          decimals: 8,
          coingeckoId: 'bitcoin',
          isNative: true,
          totalReceived: addressData.total_received / 100000000,
          totalSent: addressData.total_sent / 100000000,
          txCount: addressData.n_tx,
        },
      ],
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return { chain: 'Bitcoin', chainId: 'bitcoin', assets: [] };
    }
    console.error('blockchain.info failed, trying Blockstream:', error.message);
    return getBitcoinBalanceBlockstream(address);
  }
}

async function getBitcoinBalanceBlockstream(address) {
  const response = await axios.get(`https://blockstream.info/api/address/${address}`, {
    timeout: 8000,
  });

  const data = response.data;
  const balance =
    (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000;

  if (balance === 0) return { chain: 'Bitcoin', chainId: 'bitcoin', assets: [] };

  return {
    chain: 'Bitcoin',
    chainId: 'bitcoin',
    assets: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: balance.toString(),
        decimals: 8,
        coingeckoId: 'bitcoin',
        isNative: true,
        totalReceived: data.chain_stats.funded_txo_sum / 100000000,
        totalSent: data.chain_stats.spent_txo_sum / 100000000,
        txCount: data.chain_stats.tx_count,
      },
    ],
  };
}
