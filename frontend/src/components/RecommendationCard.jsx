export default function RecommendationCard({ result }) {
  const elements = result?.materials?.elements ?? [];
  const concerns = result?.concerns ?? [];

  return (
    <section className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">Material recommendations</h2>
      {elements.length === 0 ? (
        <p className="text-sm text-gray-400">No element recommendations in response.</p>
      ) : (
        <ul className="space-y-4">
          {elements.map((el, i) => (
            <li key={i} className="bg-gray-800/80 rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">
                Element: <span className="text-gray-200">{el.element_type ?? '—'}</span>
              </p>
              <ul className="space-y-1 text-sm">
                {(el.recommendations ?? []).slice(0, 5).map((r, j) => (
                  <li key={j} className="flex justify-between gap-4">
                    <span>{r.name}</span>
                    <span className="text-gray-400">
                      score {typeof r.score === 'number' ? r.score.toFixed(3) : r.score}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {concerns.length > 0 && (
        <div className="border-t border-amber-900/50 pt-4">
          <h3 className="text-sm font-medium text-amber-200 mb-2">Structural concerns</h3>
          <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
            {concerns.map((c, i) => (
              <li key={i}>{typeof c === 'string' ? c : JSON.stringify(c)}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
