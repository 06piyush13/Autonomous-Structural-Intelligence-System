import { useState } from 'react';
import FloorPlanUpload from './components/FloorPlanUpload';
import RecommendationCard from './components/RecommendationCard';
import BlockchainRecord from './components/BlockchainRecord';
import VerifyRecord from './components/VerifyRecord';

export default function App() {
  const [result, setResult] = useState(null);
  const [txData, setTxData] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <header className="border-b border-gray-800 px-8 py-5 flex items-center gap-4">
        <div className="w-8 h-8 bg-blue-500 rounded" />
        <div>
          <h1 className="text-xl font-bold">ASIS — Autonomous Structural Intelligence</h1>
          <p className="text-xs text-gray-400">
            Floor Plan Parser · 3D Generator · Material Optimiser · Stellar Blockchain
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <FloorPlanUpload
          onResult={setResult}
          onTx={setTxData}
          setLoading={setLoading}
          loading={loading}
        />

        {result && <RecommendationCard result={result} />}

        {txData && <BlockchainRecord txData={txData} />}

        <VerifyRecord />
      </main>
    </div>
  );
}
