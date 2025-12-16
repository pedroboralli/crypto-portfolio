import axios from 'axios';

// Base URL para API do Blockchain.com
const BLOCKCHAIN_API_URL = 'https://blockchain.info';

/**
 * Valida se um endereço Bitcoin é válido (validação básica)
 */
export function isValidBitcoinAddress(address) {
  // Validação básica para endereços Bitcoin
  // Legacy (P2PKH): começa com 1
  // SegWit (P2SH): começa com 3
  // Bech32 (P2WPKH): começa com bc1
  const legacyRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const segwitRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Regex = /^(bc1)[a-z0-9]{39,59}$/;

  return legacyRegex.test(address) || segwitRegex.test(address) || bech32Regex.test(address);
}

/**
 * Busca o saldo de Bitcoin para um endereço
 */
export async function getBitcoinBalance(address) {
  // Valida endereço
  if (!isValidBitcoinAddress(address)) {
    throw new Error('Invalid Bitcoin address');
  }

  try {
    // Faz requisição para API do Blockchain.com
    const response = await axios.get(`${BLOCKCHAIN_API_URL}/balance`, {
      params: { active: address },
      timeout: 10000
    });

    const addressData = response.data[address];

    if (!addressData) {
      throw new Error('Address not found');
    }

    // Converte de satoshis para BTC
    const balance = addressData.final_balance / 100000000;

    // Se não tem saldo, retorna array vazio
    if (balance === 0) {
      return {
        chain: 'Bitcoin',
        chainId: 'bitcoin',
        assets: []
      };
    }

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
          // Informações adicionais do endereço
          totalReceived: addressData.total_received / 100000000,
          totalSent: addressData.total_sent / 100000000,
          txCount: addressData.n_tx
        }
      ]
    };
  } catch (error) {
    // Se for erro 404 ou endereço não encontrado, retorna saldo zero
    if (error.response && error.response.status === 404) {
      return {
        chain: 'Bitcoin',
        chainId: 'bitcoin',
        assets: []
      };
    }

    console.error('Error fetching Bitcoin balance:', error.message);

    // Se a API do Blockchain.com falhar, tenta API alternativa
    try {
      return await getBitcoinBalanceAlternative(address);
    } catch (altError) {
      throw new Error(`Failed to fetch Bitcoin balance: ${error.message}`);
    }
  }
}

/**
 * API alternativa para buscar saldo de Bitcoin (Blockstream)
 */
async function getBitcoinBalanceAlternative(address) {
  try {
    const response = await axios.get(
      `https://blockstream.info/api/address/${address}`,
      { timeout: 10000 }
    );

    const data = response.data;

    // Calcula saldo (funded - spent)
    const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000;

    if (balance === 0) {
      return {
        chain: 'Bitcoin',
        chainId: 'bitcoin',
        assets: []
      };
    }

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
          txCount: data.chain_stats.tx_count
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching Bitcoin balance from alternative API:', error.message);
    throw error;
  }
}

/**
 * Busca informações adicionais sobre um endereço Bitcoin
 */
export async function getBitcoinAddressInfo(address) {
  if (!isValidBitcoinAddress(address)) {
    throw new Error('Invalid Bitcoin address');
  }

  try {
    const response = await axios.get(
      `https://blockstream.info/api/address/${address}`,
      { timeout: 10000 }
    );

    return {
      address: response.data.address,
      balance: (response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum) / 100000000,
      totalReceived: response.data.chain_stats.funded_txo_sum / 100000000,
      totalSent: response.data.chain_stats.spent_txo_sum / 100000000,
      txCount: response.data.chain_stats.tx_count
    };
  } catch (error) {
    console.error('Error fetching Bitcoin address info:', error.message);
    throw error;
  }
}
