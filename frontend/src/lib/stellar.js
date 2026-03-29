import {
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
} from '@stellar/stellar-sdk';

const { Api } = rpc;

const CONTRACT_ID = process.env.REACT_APP_CONTRACT_ID;
const SOROBAN_RPC = 'https://soroban-testnet.stellar.org';

const server = new rpc.Server(SOROBAN_RPC);

function requireContractId() {
  if (!CONTRACT_ID) {
    throw new Error('Set REACT_APP_CONTRACT_ID in .env.local');
  }
}

/**
 * Store an ASIS recommendation on the Stellar blockchain.
 */
export async function storeRecommendation({
  planHash,
  topMaterial,
  elementType,
  score,
  hasStructuralConcern,
  secretKey,
}) {
  requireContractId();
  const keypair = Keypair.fromSecret(secretKey);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(CONTRACT_ID);

  const scoreScaled =
    typeof score === 'number' && score <= 1 && score >= 0
      ? Math.round(score * 1000)
      : Math.round(Number(score));

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'store_recommendation',
        nativeToScVal(planHash, { type: 'string' }),
        nativeToScVal(topMaterial, { type: 'string' }),
        nativeToScVal(elementType, { type: 'string' }),
        nativeToScVal(scoreScaled, { type: 'i64' }),
        nativeToScVal(hasStructuralConcern, { type: 'bool' }),
      ),
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);
  const result = await server.sendTransaction(prepared);

  let response;
  do {
    await new Promise((r) => setTimeout(r, 2000));
    response = await server.getTransaction(result.hash);
  } while (response.status === Api.GetTransactionStatus.NOT_FOUND);

  if (response.status === Api.GetTransactionStatus.FAILED) {
    throw new Error('Transaction failed on network');
  }

  return {
    txHash: result.hash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
  };
}

async function ensureTestnetAccount(keypair) {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`,
  );
  if (!res.ok) {
    throw new Error('Friendbot funding failed (rate limit or network). Retry shortly.');
  }
}

/**
 * Read-only: fund a throwaway account via Friendbot, then simulate get_recommendation.
 */
export async function getRecommendation(planHash) {
  requireContractId();
  const keypair = Keypair.random();
  await ensureTestnetAccount(keypair);
  const account = await server.getAccount(keypair.publicKey());

  const contract = new Contract(CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'get_recommendation',
        nativeToScVal(planHash, { type: 'string' }),
      ),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!Api.isSimulationSuccess(sim) || !sim.result) {
    return null;
  }

  const native = scValToNative(sim.result.retval);
  if (native == null) {
    return null;
  }
  return native;
}

/**
 * SHA256 of file bytes as hex (matches contract plan_hash key).
 */
export async function hashFile(file) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
