// Script de teste para verificar conectividade com BNB Chain
import { ethers } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// RPCs da BNB Chain
const RPC_URLS = [
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
  'https://bsc-dataseed3.binance.org',
  'https://bsc-dataseed.bnbchain.org',
  'https://bsc.publicnode.com'
];

// Teste de endereço (use seu endereço aqui)
const TEST_ADDRESS = process.argv[2] || '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3'; // Binance Hot Wallet

// Alguns tokens BEP-20 populares
const TOKENS = [
  { address: '0x55d398326f99059fF775485246999027B3197955', name: 'USDT' },
  { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', name: 'USDC' },
  { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', name: 'BUSD' },
  { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', name: 'CAKE' }
];

async function testRPC(rpcUrl) {
  try {
    console.log(`\nTestando RPC: ${rpcUrl}`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Testa conexão básica
    const blockNumber = await provider.getBlockNumber();
    console.log(`✓ Conectado! Block: ${blockNumber}`);

    // Testa saldo nativo (BNB)
    const balance = await provider.getBalance(TEST_ADDRESS);
    const bnbBalance = ethers.formatEther(balance);
    console.log(`✓ BNB Balance: ${bnbBalance}`);

    // Testa alguns tokens
    for (const token of TOKENS) {
      try {
        const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const tokenBalance = await contract.balanceOf(TEST_ADDRESS);
        const decimals = await contract.decimals();
        const symbol = await contract.symbol();
        const formatted = ethers.formatUnits(tokenBalance, decimals);

        if (parseFloat(formatted) > 0) {
          console.log(`✓ ${symbol}: ${formatted}`);
        }
      } catch (err) {
        console.log(`✗ ${token.name}: ${err.message}`);
      }
    }

    return true;
  } catch (error) {
    console.log(`✗ Erro: ${error.message}`);
    return false;
  }
}

async function testAllRPCs() {
  console.log('=== Teste de Conectividade BNB Chain ===');
  console.log(`Testando endereço: ${TEST_ADDRESS}\n`);

  let successCount = 0;

  for (const rpc of RPC_URLS) {
    const success = await testRPC(rpc);
    if (success) successCount++;
  }

  console.log(`\n=== Resultado ===`);
  console.log(`${successCount}/${RPC_URLS.length} RPCs funcionando`);

  if (successCount === 0) {
    console.log('\n⚠️ PROBLEMA: Nenhum RPC está respondendo!');
    console.log('Possíveis soluções:');
    console.log('1. Verifique sua conexão com a internet');
    console.log('2. Tente usar uma VPN');
    console.log('3. Configure ALCHEMY_API_KEY no .env');
  }
}

testAllRPCs().catch(console.error);
