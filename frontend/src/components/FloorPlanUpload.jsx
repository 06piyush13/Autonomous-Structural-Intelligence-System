import { useState } from 'react';
import axios from 'axios';
import { hashFile, storeRecommendation } from '../lib/stellar';

const PIPELINE_API =
  process.env.REACT_APP_PIPELINE_URL || 'http://localhost:8000/analyze';
const DEMO_SECRET = process.env.REACT_APP_STELLAR_SECRET;

export default function FloorPlanUpload({ onResult, onTx, setLoading, loading }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  async function handleAnalyze() {
    if (!file) return;
    if (!DEMO_SECRET) {
      setStatus('❌ Set REACT_APP_STELLAR_SECRET in .env.local (testnet key).');
      return;
    }
    setLoading(true);

    try {
      setStatus('Hashing floor plan...');
      const planHash = await hashFile(file);

      setStatus('Running AI pipeline (stages 1–5)...');
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(PIPELINE_API, form, {
        timeout: 120000,
      });
      onResult(data);

      const topEl = data?.materials?.elements?.[0];
      const topRec = topEl?.recommendations?.[0];
      if (!topEl || !topRec) {
        throw new Error('Pipeline response missing materials.elements[0] or recommendations');
      }

      setStatus('Recording recommendations on Stellar blockchain...');
      const txPayload = await storeRecommendation({
        planHash,
        topMaterial: topRec.name,
        elementType: topEl.element_type,
        score: topRec.score,
        hasStructuralConcern: Array.isArray(data.concerns) && data.concerns.length > 0,
        secretKey: DEMO_SECRET,
      });

      onTx({ ...txPayload, planHash });
      setStatus('✅ Done — recorded on Stellar testnet!');
    } catch (err) {
      let msg = err.response?.data?.detail || err.message;
      if (err.code === 'ERR_NETWORK' || /network error/i.test(String(msg))) {
        msg = `Cannot reach pipeline at ${PIPELINE_API}. Start the API: cd api && . .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000`;
      }
      setStatus(`❌ Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">Upload Floor Plan</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4
                   file:rounded file:border-0 file:bg-blue-600 file:text-white
                   hover:file:bg-blue-500 cursor-pointer"
      />
      <button
        type="button"
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
