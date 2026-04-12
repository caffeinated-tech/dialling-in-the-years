/**
 * Renders a row of decade buttons (and an "All" button) based on the years
 * present in the provided songs array.
 */
export default function DecadeFilter({ songs, activDecade, onSelect }) {
  const decades = [...new Set(songs.map((s) => Math.floor(s.year / 10) * 10))].sort();

  if (decades.length === 0) return null;

  return (
    <div className="decade-filter" role="group" aria-label="Filter by decade">
      <button
        className={`decade-filter__btn${activDecade === null ? ' decade-filter__btn--active' : ''}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {decades.map((decade) => (
        <button
          key={decade}
          className={`decade-filter__btn${activDecade === decade ? ' decade-filter__btn--active' : ''}`}
          onClick={() => onSelect(decade)}
        >
          {decade}s
        </button>
      ))}
    </div>
  );
}
