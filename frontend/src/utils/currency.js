// Utilitários para formatação de moedas

/**
 * Formata valor em BRL (Real Brasileiro)
 */
export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata valor em USD (Dólar Americano)
 */
export function formatUSD(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata valor em BTC (Bitcoin)
 */
export function formatBTC(value) {
  // Para valores muito pequenos, usa notação científica
  if (value > 0 && value < 0.00000001) {
    return `₿ ${value.toExponential(2)}`;
  }

  // Para valores normais, usa até 8 casas decimais
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(value);

  return `₿ ${formatted}`;
}

/**
 * Formata valor baseado na moeda selecionada
 */
export function formatCurrency(value, currency) {
  switch (currency) {
    case 'BRL':
      return formatBRL(value);
    case 'USD':
      return formatUSD(value);
    case 'BTC':
      return formatBTC(value);
    default:
      return formatBRL(value);
  }
}

/**
 * Obtém o símbolo da moeda
 */
export function getCurrencySymbol(currency) {
  switch (currency) {
    case 'BRL':
      return 'R$';
    case 'USD':
      return '$';
    case 'BTC':
      return '₿';
    default:
      return 'R$';
  }
}

/**
 * Obtém o nome da moeda
 */
export function getCurrencyName(currency) {
  switch (currency) {
    case 'BRL':
      return 'Real Brasileiro';
    case 'USD':
      return 'Dólar Americano';
    case 'BTC':
      return 'Bitcoin';
    default:
      return 'Real Brasileiro';
  }
}

/**
 * Obtém o valor do asset na moeda selecionada
 */
export function getAssetValue(asset, currency) {
  switch (currency) {
    case 'BRL':
      return asset.valueBRL || 0;
    case 'USD':
      return asset.valueUSD || 0;
    case 'BTC':
      return asset.valueBTC || 0;
    default:
      return asset.valueBRL || 0;
  }
}

/**
 * Obtém o preço do asset na moeda selecionada
 */
export function getAssetPrice(asset, currency) {
  switch (currency) {
    case 'BRL':
      return asset.priceBRL || 0;
    case 'USD':
      return asset.priceUSD || 0;
    case 'BTC':
      return asset.priceBTC || 0;
    default:
      return asset.priceBRL || 0;
  }
}

/**
 * Obtém o valor total da chain na moeda selecionada
 */
export function getChainTotal(chain, currency) {
  switch (currency) {
    case 'BRL':
      return chain.totalValueBRL || 0;
    case 'USD':
      return chain.totalValueUSD || 0;
    case 'BTC':
      return chain.totalValueBTC || 0;
    default:
      return chain.totalValueBRL || 0;
  }
}

/**
 * Formata número com separadores (para quantidades)
 */
export function formatNumber(value, decimals = 8) {
  const num = parseFloat(value);
  if (num === 0) return '0';

  // Se for número muito pequeno, usa notação científica
  if (num < 0.00000001) {
    return num.toExponential(2);
  }

  // Determina casas decimais com base no valor
  let maxDecimals = decimals;
  if (num >= 1) {
    maxDecimals = Math.min(4, decimals);
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  }).format(num);
}
