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
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 px-4 py-1.5 bg-green-700 hover:bg-green-600
                     rounded text-sm font-medium transition-colors"
        >
          View on Stellar Expert →
        </a>
      </div>
      <p className="text-xs text-gray-500">
        These material recommendations are permanently recorded on the Stellar blockchain. Any architect can
        verify this AI analysis is authentic and unmodified.
      </p>
    </section>
  );
}
