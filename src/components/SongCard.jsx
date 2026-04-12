export default function SongCard({ song, showSubmitter = false }) {
  return (
    <article className="song-card">
      <div className="song-card__year">{song.year}</div>
      <div className="song-card__body">
        <h3 className="song-card__title">{song.title}</h3>
        <p className="song-card__artist">{song.artist}</p>
        {song.story && <p className="song-card__story">{song.story}</p>}
        {showSubmitter && song.submitterName && (
          <p className="song-card__submitter">Submitted by {song.submitterName}</p>
        )}
      </div>
    </article>
  );
}
