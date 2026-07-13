export default function LostPetsLoading() {
  return (
    <div className="page-container state-page" aria-busy="true" aria-live="polite">
      <section className="loading-state">
        <span className="loading-pulse" />
        <span className="loading-pulse" />
        <span className="loading-pulse" />
        <p>Loading lost-pet posts…</p>
      </section>
    </div>
  );
}
