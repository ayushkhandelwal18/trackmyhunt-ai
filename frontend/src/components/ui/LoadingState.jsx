function LoadingState({ rows = 3 }) {
  return <div className="app-loading-state" aria-label="Loading">{Array.from({ length: rows }, (_, index) => <div key={index} className="app-skeleton" />)}</div>;
}

export default LoadingState;