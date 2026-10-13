function ShopsyLoader({ label = "Setting up your Shopsy experience...", fullScreen = false }) {
  return (
    <div className={`shopsy-loader${fullScreen ? " shopsy-loader-fullscreen" : ""}`} role="status" aria-live="polite">
      <div className="shopsy-loader-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <strong>{label}</strong>
      <small>Curating something good</small>
    </div>
  );
}

export default ShopsyLoader;
