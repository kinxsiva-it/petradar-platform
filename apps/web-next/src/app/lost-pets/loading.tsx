export default function LostPetsLoading() {
  return (
    <div className="page-container lost-pets-page lost-pets-loading-page" aria-busy="true" aria-live="polite">
      <section className="lost-pets-loading-hero">
        <span className="loading-pulse" />
        <span className="loading-pulse" />
        <span className="loading-pulse" />
      </section>
      <div className="lost-pets-loading-filters loading-pulse" />
      <section className="lost-pets-loading-content">
        <div className="lost-pets-loading-grid">
          <span className="loading-pulse" />
          <span className="loading-pulse" />
          <span className="loading-pulse" />
        </div>
        <span className="lost-pets-loading-sidebar loading-pulse" />
      </section>
      <p className="visually-hidden">Loading lost-pet posts...</p>
    </div>
  );
}
