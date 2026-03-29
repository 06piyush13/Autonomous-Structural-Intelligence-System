# 🌐 WEB3_INTEGRATION.md — Stellar + Soroban for ASIS
### PS 2 · +25 Bonus Marks · Full Stack dApp Guide

---

## 🎯 What "Meaningful Integration" Means for Your Project

The judges are explicit: **storing a random hash → 0 marks**.

Your smart contract must **interact with pipeline output**. Here's the winning idea:

> **"Structural Recommendation Registry"** — When ASIS analyzes a floor plan, the material recommendations + structural concern flags are **recorded on-chain via a Soroban smart contract**. Any architect can later query the Stellar blockchain to verify the AI's recommendations are authentic, immutable, and timestamped.

This is meaningful because:
- The contract input = your pipeline's actual output (material recommendations)
- The frontend calls the pipeline → gets recommendations → stores on-chain → shows block explorer link
- Judges can verify the on-chain record exists

---

## 📁 Final Repo Structure (Add to Your Existing Project)

```
/home/piyush/Piyush/ANTIGRAVITY/PS 2/
├── pipeline/                     ← your existing ASIS pipeline
├── api/                          ← your existing FastAPI
├── viewer/                       ← your existing Three.js viewer
│
├── contracts/                    ← NEW: Soroban smart contract
│   └── asis-registry/
│       ├── Cargo.toml
│       ├── Cargo.lock
│       └── src/
│           └── lib.rs            ← smart contract code
│
├── frontend/                     ← NEW: React + Tailwind dApp
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FloorPlanUpload.jsx
│   │   │   ├── RecommendationCard.jsx
│   │   │   ├── BlockchainRecord.jsx
│   │   │   └── VerifyRecord.jsx
│   │   ├── lib/
│   │   │   └── stellar.js        ← Stellar-SDK integration logic
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.jsx
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
│
├── .gitignore
├── README.md                     ← must follow the required format
└── PRD.md
```

---

## 🦀 Step 1 — Install Rust + Stellar CLI (Ubuntu 24.04)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Add WASM target (required for Soroban)
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Verify
stellar --version
```

---

## 🦀 Step 2 — Smart Contract (`contracts/asis-registry/src/lib.rs`)

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String, Symbol, Vec};

/// Stores one material recommendation record
#[contracttype]
#[derive(Clone)]
pub struct RecommendationRecord {
    pub plan_hash: String,        // SHA256 of the floor plan image
    pub top_material: String,     // e.g. "Red Brick"
    pub element_type: String,     // e.g. "load_bearing_wall"
    pub score: i64,               // score × 1000 (e.g. 0.74 → 740)
    pub has_structural_concern: bool,
    pub timestamp: u64,           // ledger timestamp
}

#[contract]
pub struct ASISRegistry;

#[contractimpl]
impl ASISRegistry {
    /// Store a recommendation record on-chain
    pub fn store_recommendation(
        env: Env,
        plan_hash: String,
        top_material: String,
        element_type: String,
        score: i64,
        has_structural_concern: bool,
    ) -> String {
        let record = RecommendationRecord {
            plan_hash: plan_hash.clone(),
            top_material,
            element_type,
            score,
            has_structural_concern,
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&plan_hash, &record);
        plan_hash   // return the key for frontend to display
    }

    /// Retrieve a stored recommendation by plan hash
    pub fn get_recommendation(env: Env, plan_hash: String) -> Option<RecommendationRecord> {
        env.storage().persistent().get(&plan_hash)
    }

    /// Check if a plan has been analyzed before
    pub fn plan_exists(env: Env, plan_hash: String) -> bool {
        env.storage().persistent().has(&plan_hash)
    }
}

mod test {
    use super::*;
    use soroban_sdk::testutils::Ledger;

    #[test]
    fn test_store_and_retrieve() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ASISRegistry);
        let client = ASISRegistryClient::new(&env, &contract_id);

        let plan_hash = String::from_str(&env, "abc123def456");
        let material  = String::from_str(&env, "Red Brick");
        let elem_type = String::from_str(&env, "load_bearing_wall");

        client.store_recommendation(&plan_hash, &material, &elem_type, &740, &false);

        let record = client.get_recommendation(&plan_hash).unwrap();
        assert_eq!(record.score, 740);
    }
}
```

**`contracts/asis-registry/Cargo.toml`:**
```toml
[package]
name = "asis-registry"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = { version = "21.0.0", features = ["alloc"] }

[dev-dependencies]
soroban-sdk = { version = "21.0.0", features = ["testutils"] }

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true
```

---

## 🚀 Step 3 — Build & Deploy the Contract

```bash
cd "/home/piyush/Piyush/ANTIGRAVITY/PS 2/contracts/asis-registry"

# Build
stellar contract build

# Configure Testnet identity (do this once)
stellar keys generate piyush-key --network testnet
stellar keys address piyush-key    # copy this address

# Fund your testnet account (Friendbot)
curl "https://friendbot.stellar.org?addr=$(stellar keys address piyush-key)"

# Deploy to Testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/asis_registry.wasm \
  --source piyush-key \
  --network testnet

# ✅ COPY THE CONTRACT ID — you'll need this in frontend and README
# Looks like: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Save the Contract ID — it goes in your README and `.env`:**
```env
VITE_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_NETWORK=testnet
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_SOROBAN_RPC=https://soroban-testnet.stellar.org
```

---

## ⚛️ Step 4 — React Frontend (`frontend/`)

### Setup
```bash
cd "/home/piyush/Piyush/ANTIGRAVITY/PS 2/frontend"
npx create-react-app . --template cra-template
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @stellar/stellar-sdk axios
```

**`tailwind.config.js`:**
```js
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### Stellar Integration (`frontend/src/lib/stellar.js`)

This is the **critical file** — judges check this exists and works:

```javascript
import * as StellarSdk from '@stellar/stellar-sdk';

const CONTRACT_ID  = process.env.REACT_APP_CONTRACT_ID;
const NETWORK      = 'TESTNET';
const HORIZON_URL  = 'https://horizon-testnet.stellar.org';
const SOROBAN_RPC  = 'https://soroban-testnet.stellar.org';

const server = new StellarSdk.SorobanRpc.Server(SOROBAN_RPC);
const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Store an ASIS recommendation on the Stellar blockchain.
 * Called after the pipeline produces material recommendations.
 */
export async function storeRecommendation({
  planHash,
  topMaterial,
  elementType,
  score,
  hasStructuralConcern,
  secretKey,          // user's Stellar secret key (testnet)
}) {
  const keypair = StellarSdk.Keypair.fromSecret(secretKey);
  const account = await server.getAccount(keypair.publicKey());

  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'store_recommendation',
        StellarSdk.nativeToScVal(planHash,             { type: 'string' }),
        StellarSdk.nativeToScVal(topMaterial,          { type: 'string' }),
        StellarSdk.nativeToScVal(elementType,          { type: 'string' }),
        StellarSdk.nativeToScVal(Math.round(score * 1000), { type: 'i64' }),
        StellarSdk.nativeToScVal(hasStructuralConcern, { type: 'bool'   }),
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);
  const result = await server.sendTransaction(prepared);

  // Poll for confirmation
  let response;
  do {
    await new Promise(r => setTimeout(r, 2000));
    response = await server.getTransaction(result.hash);
  } while (response.status === 'NOT_FOUND');

  return {
    txHash: result.hash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
  };
}

/**
 * Verify / retrieve a recommendation from the blockchain.
 */
export async function getRecommendation(planHash) {
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const keypair  = StellarSdk.Keypair.random();  // read-only, random is fine
  const account  = await server.getAccount(keypair.publicKey()).catch(() => null);

  if (!account) return null;

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(contract.call(
      'get_recommendation',
      StellarSdk.nativeToScVal(planHash, { type: 'string' }),
    ))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (!result.result) return null;

  return StellarSdk.scValToNative(result.result.retval);
}

/**
 * Generate SHA256 hash of a file (plan image) for use as plan_hash key.
 */
export async function hashFile(file) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

---

### Main App (`frontend/src/App.jsx`)

```jsx
import { useState } from 'react';
import FloorPlanUpload from './components/FloorPlanUpload';
import RecommendationCard from './components/RecommendationCard';
import BlockchainRecord from './components/BlockchainRecord';
import VerifyRecord from './components/VerifyRecord';

export default function App() {
  const [result, setResult]   = useState(null);
  const [txData, setTxData]   = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-5 flex items-center gap-4">
        <div className="w-8 h-8 bg-blue-500 rounded" />
        <div>
          <h1 className="text-xl font-bold">ASIS — Autonomous Structural Intelligence</h1>
          <p className="text-xs text-gray-400">Floor Plan Parser · 3D Generator · Material Optimiser · Stellar Blockchain</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Stage 1–5: Upload + Pipeline */}
        <FloorPlanUpload
          onResult={setResult}
          onTx={setTxData}
          setLoading={setLoading}
          loading={loading}
        />

        {/* Material Recommendations */}
        {result && <RecommendationCard result={result} />}

        {/* Blockchain Record */}
        {txData && <BlockchainRecord txData={txData} />}

        {/* Verify Past Records */}
        <VerifyRecord />
      </main>
    </div>
  );
}
```

---

### Upload + Pipeline + Blockchain (`frontend/src/components/FloorPlanUpload.jsx`)

```jsx
import { useState } from 'react';
import axios from 'axios';
import { hashFile, storeRecommendation } from '../lib/stellar';

const PIPELINE_API = 'http://localhost:8000/analyze';
// Testnet secret key — for demo only, never use a real funded account here
const DEMO_SECRET = process.env.REACT_APP_STELLAR_SECRET;

export default function FloorPlanUpload({ onResult, onTx, setLoading, loading }) {
  const [file, setFile]     = useState(null);
  const [status, setStatus] = useState('');

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);

    try {
      // 1. Hash the plan image
      setStatus('Hashing floor plan...');
      const planHash = await hashFile(file);

      // 2. Run ASIS pipeline
      setStatus('Running AI pipeline (stages 1–5)...');
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(PIPELINE_API, form);
      onResult(data);

      // 3. Store top recommendation on Stellar blockchain
      setStatus('Recording recommendations on Stellar blockchain...');
      const topEl = data.materials.elements[0];
      const txData = await storeRecommendation({
        planHash,
        topMaterial:          topEl.recommendations[0].name,
        elementType:          topEl.element_type,
        score:                topEl.recommendations[0].score,
        hasStructuralConcern: data.concerns.length > 0,
        secretKey:            DEMO_SECRET,
      });

      onTx({ ...txData, planHash });
      setStatus('✅ Done — recorded on Stellar testnet!');
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">Upload Floor Plan</h2>
      <input
        type="file" accept="image/*"
        onChange={e => setFile(e.target.files[0])}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4
                   file:rounded file:border-0 file:bg-blue-600 file:text-white
                   hover:file:bg-blue-500 cursor-pointer"
      />
      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40
                   rounded font-medium transition-colors"
      >
        {loading ? status : 'Analyze + Record on Blockchain'}
      </button>
      {status && <p className="text-sm text-gray-400">{status}</p>}
    </section>
  );
}
```

---

### Blockchain Record Display (`frontend/src/components/BlockchainRecord.jsx`)

```jsx
export default function BlockchainRecord({ txData }) {
  return (
    <section className="bg-gray-900 border border-green-700 rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <h2 className="text-lg font-semibold text-green-400">Recorded on Stellar Testnet</h2>
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Plan Hash: </span>
          <code className="text-xs text-gray-300 break-all">{txData.planHash}</code>
        </div>
        <div>
          <span className="text-gray-400">Transaction Hash: </span>
          <code className="text-xs text-gray-300 break-all">{txData.txHash}</code>
        </div>
        <a
          href={txData.explorerUrl}
          target="_blank" rel="noreferrer"
          className="inline-block mt-2 px-4 py-1.5 bg-green-700 hover:bg-green-600
                     rounded text-sm font-medium transition-colors"
        >
          View on Stellar Expert →
        </a>
      </div>
      <p className="text-xs text-gray-500">
        These material recommendations are permanently recorded on the Stellar blockchain.
        Any architect can verify this AI analysis is authentic and unmodified.
      </p>
    </section>
  );
}
```

---

### Verify Past Records (`frontend/src/components/VerifyRecord.jsx`)

```jsx
import { useState } from 'react';
import { getRecommendation } from '../lib/stellar';

export default function VerifyRecord() {
  const [hash, setHash]     = useState('');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    setLoading(true);
    const r = await getRecommendation(hash);
    setRecord(r);
    setLoading(false);
  }

  return (
    <section className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">Verify Past Recommendation</h2>
      <div className="flex gap-2">
        <input
          value={hash}
          onChange={e => setHash(e.target.value)}
          placeholder="Enter floor plan SHA256 hash..."
          className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2
                     text-sm text-gray-200 placeholder-gray-500 focus:outline-none
                     focus:border-blue-500"
        />
        <button
          onClick={handleVerify}
          disabled={!hash || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40
                     rounded text-sm font-medium transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
      {record && (
        <div className="bg-gray-800 rounded p-4 text-sm space-y-1">
          <p><span className="text-gray-400">Top Material:</span> {record.top_material}</p>
          <p><span className="text-gray-400">Element Type:</span> {record.element_type}</p>
          <p><span className="text-gray-400">Score:</span> {(record.score / 1000).toFixed(3)}</p>
          <p><span className="text-gray-400">Structural Concern:</span> {record.has_structural_concern ? '⚠️ Yes' : '✅ No'}</p>
          <p><span className="text-gray-400">Timestamp:</span> {new Date(record.timestamp * 1000).toLocaleString()}</p>
        </div>
      )}
    </section>
  );
}
```

---

## 📋 Step 5 — README.md (Required Format — Write This Last)

```markdown
# ASIS — Autonomous Structural Intelligence System

## Project Description
ASIS is an AI-powered pipeline that reads floor plan images, reconstructs them as 
3D structural models, and recommends construction materials with cost-strength tradeoff 
analysis. Material recommendations are recorded immutably on the Stellar blockchain 
via a Soroban smart contract, allowing architects to verify AI analysis authenticity.

## Project Vision
To make structural material analysis accessible, transparent, and verifiable — combining 
AI-driven recommendations with blockchain-backed auditability.

## Key Features
- OpenCV floor plan parsing (walls, rooms, openings)
- 3D model generation via Three.js (browser-based, interactive)
- Element-type-weighted material tradeoff scoring
- LLM-generated plain-English structural explanations
- Soroban smart contract records recommendations on Stellar testnet
- React + Tailwind frontend with Stellar-SDK integration

## Deployed Smart Contract Details

**Contract ID:** `CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

**Network:** Stellar Testnet

> [Screenshot of block explorer showing deployed contract here]

## UI Screenshots
> [Screenshots of the web app — upload, 3D model, recommendations, blockchain record]

## Project Setup Guide

### Prerequisites
- Python 3.11, Node.js 20, Rust (with wasm32 target), Stellar CLI

### Backend (ASIS Pipeline)
\`\`\`bash
cd "PS 2"
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
\`\`\`

### Frontend
\`\`\`bash
cd frontend
cp .env.example .env   # add CONTRACT_ID and STELLAR_SECRET
npm install
npm start              # http://localhost:3000
\`\`\`

## Future Scope
- Multi-storey floor plan support with inter-floor load tracking
- DAO-governed material database updates via Soroban
- On-chain cost breakdown with real-time Stellar asset pricing
- Multi-architect review workflow using Stellar multi-sig

## Demo Video
> [Optional — add link]
```

---

## 🚀 Step 6 — Run Everything

```bash
# Terminal 1: ASIS Pipeline API
cd "/home/piyush/Piyush/ANTIGRAVITY/PS 2"
source .venv/bin/activate.fish
uvicorn api.main:app --reload --port 8000

# Terminal 2: React Frontend
cd "/home/piyush/Piyush/ANTIGRAVITY/PS 2/frontend"
npm start
# Opens http://localhost:3000

# Browser: Upload plan_b.png → AI analyzes → Stellar records → show explorer link
```

---

## 🔗 Final Submission

1. Push **everything** (contracts + frontend + pipeline) to `https://github.com/dynamo0369/Prompt`
2. Make sure repo is **public**
3. Submit at: **https://www.risein.com/programs/hackathon-project-submission-stellar?referral=JEtvo**
4. Include your **Contract ID** and **block explorer screenshot** in README

---

## ✅ Web3 Scoring Checklist

| Criterion | Marks | Your Status |
|-----------|-------|-------------|
| Valid repo: Frontend + Smart Contract + Integration in one repo | 10 | ✅ follow structure above |
| Meaningful use — recommendations stored per plan hash, queryable | 10 | ✅ not a random hash |
| Quality of demo — show upload → pipeline → Stellar record live | 5 | ✅ demo flow covers this |
| **TOTAL** | **25** | |

---

*Stellar Testnet · Soroban SDK 21.0.0 · React 18 + Tailwind · Ubuntu 24.04*