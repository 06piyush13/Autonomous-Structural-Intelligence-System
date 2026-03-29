import { useState } from 'react';
import { getRecommendation } from '../lib/stellar';

function unwrapRecord(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object' && raw !== null && 'Some' in raw) {
    return raw.Some ?? null;
  }
  return raw;
}

export default function VerifyRecord() {
  const [hash, setHash] = useState('');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleVerify() {
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const r = unwrapRecord(await getRecommendation(hash.trim()));
      setRecord(r);
      setSearched(true);
    } catch (e) {
      setError(e.message || String(e));
      setRecord(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">Verify Past Recommendation</h2>
      <div className="flex gap-2">
        <input
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="Enter floor plan SHA256 hash..."
          className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2
                     text-sm text-gray-200 placeholder-gray-500 focus:outline-none
                     focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={!hash.trim() || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40
                     rounded text-sm font-medium transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {record && (
        <div className="bg-gray-800 rounded p-4 text-sm space-y-1">
          <p>
            <span className="text-gray-400">Top Material:</span> {record.top_material}
          </p>
          <p>
            <span className="text-gray-400">Element Type:</span> {record.element_type}
          </p>
          <p>
            <span className="text-gray-400">Score:</span>{' '}
            {(Number(record.score) / 1000).toFixed(3)}
          </p>
          <p>
            <span className="text-gray-400">Structural Concern:</span>{' '}
            {record.has_structural_concern ? '⚠️ Yes' : '✅ No'}
          </p>
          <p>
            <span className="text-gray-400">Timestamp:</span>{' '}
            {new Date(Number(record.timestamp) * 1000).toLocaleString()}
          </p>
        </div>
      )}
      {searched && !record && !error && (
        <p className="text-sm text-gray-500">No on-chain record for this hash.</p>
      )}
    </section>
  );
}
