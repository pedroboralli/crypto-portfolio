import axios from 'axios';

const LEGACY_REGEX = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const P2SH_REGEX = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const BECH32_REGEX = /^bc1[ac-hj-np-z02-9]{39,59}$/;

/**
 * Normaliza um endereco bech32 para minusculas.
 *
 * O BIP-173 aceita o endereco todo em maiusculas (formato usado em QR codes),
 * mas proibe misturar os dois casos. Os endpoints de saldo so entendem
 * minusculas, entao normalizamos aqui; legacy/P2SH sao base58 e case-sensitive.
 */
export function normalizeBitcoinAddress(address) {
  const trimmed = String(address || '').trim();
  if (/^(bc1|BC1)/.test(trimmed)) {
    const isUniformCase = trimmed === trimmed.toLowerCase() || trimmed === trimmed.toUpperCase();
    if (isUniformCase) return trimmed.toLowerCase();
  }
  return trimmed;
}

export function isValidBitcoinAddress(address) {
  const normalized = normalizeBitcoinAddress(address);
  return (
    LEGACY_REGEX.test(normalized) ||
    P2SH_REGEX.test(normalized) ||
    BECH32_REGEX.test(normalized)
  );
}

export async function getBitcoinBalance(rawAddress) {
  if (!isValidBitcoinAddress(rawAddress)) {
    throw new Error('Invalid Bitcoin address');
  }

  const address = normalizeBitcoinAddress(rawAddress);

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

    try {
      return await getBitcoinBalanceBlockstream(address);
    } catch (blockstreamError) {
      console.error('Blockstream failed, trying mempool.space:', blockstreamError.message);
      try {
        return await getBitcoinBalanceMempool(address);
      } catch (mempoolError) {
        throw new Error(`Nao foi possivel consultar o saldo Bitcoin: ${mempoolError.message}`);
      }
    }
  }
}

/**
 * Saldo a partir das estatisticas de UTXO (Blockstream e mempool.space usam o
 * mesmo formato). Inclui o mempool para que uma transacao recem-enviada apareca.
 */
function balanceFromStats(data) {
  const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  const pending = data.mempool_stats
    ? data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum
    : 0;
  return (confirmed + pending) / 100000000;
}

function bitcoinAsset(balance, data) {
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

async function getBitcoinBalanceMempool(address) {
  const response = await axios.get(`https://mempool.space/api/address/${address}`, {
    timeout: 8000,
  });
  return bitcoinAsset(balanceFromStats(response.data), response.data);
}

async function getBitcoinBalanceBlockstream(address) {
  const response = await axios.get(`https://blockstream.info/api/address/${address}`, {
    timeout: 8000,
  });
  return bitcoinAsset(balanceFromStats(response.data), response.data);
}
