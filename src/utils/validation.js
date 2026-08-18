// Address validation utilities

const ethRegex = /^0x[a-fA-F0-9]{40}$/;
const btcLegacyRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const btcSegwitRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const btcBech32Regex = /^bc1[ac-hj-np-z02-9]{39,59}$/;

/**
 * Endereco bech32 em maiusculas e valido (BIP-173, usado em QR code), mas as
 * APIs de saldo so aceitam minusculas. Precisa casar com a mesma normalizacao
 * do backend em lib/services/bitcoinService.js.
 */
export function normalizeBitcoinAddress(address) {
  const trimmed = String(address || '').trim();
  if (/^(bc1|BC1)/.test(trimmed)) {
    const isUniformCase = trimmed === trimmed.toLowerCase() || trimmed === trimmed.toUpperCase();
    if (isUniformCase) return trimmed.toLowerCase();
  }
  return trimmed;
}

/**
 * Checks if an address is a valid EVM address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid EVM address
 */
export function isEVMAddress(address) {
  return ethRegex.test(address);
}

/**
 * Checks if an address is a valid Bitcoin address (any format)
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid Bitcoin address
 */
export function isBitcoinAddress(address) {
  const normalized = normalizeBitcoinAddress(address);
  return btcLegacyRegex.test(normalized) ||
         btcSegwitRegex.test(normalized) ||
         btcBech32Regex.test(normalized);
}

/**
 * Validates a wallet address and returns an error message if invalid
 * @param {string} address - The address to validate
 * @returns {string|null} - Error message or null if valid
 */
export function validateAddress(address) {
  if (!address || address.trim().length === 0) {
    return 'Endereço é obrigatório';
  }

  const trimmedAddress = address.trim();
  const isEthAddress = isEVMAddress(trimmedAddress);
  const isBtcAddress = isBitcoinAddress(trimmedAddress);

  if (!isEthAddress && !isBtcAddress) {
    return 'Endereço inválido. Use um endereço EVM (0x...) ou Bitcoin';
  }

  return null;
}

/**
 * Determines the type of wallet address
 * @param {string} address - The address to check
 * @returns {'evm'|'bitcoin'|null} - The address type or null if invalid
 */
export function getAddressType(address) {
  if (isEVMAddress(address)) {
    return 'evm';
  }
  if (isBitcoinAddress(address)) {
    return 'bitcoin';
  }
  return null;
}
