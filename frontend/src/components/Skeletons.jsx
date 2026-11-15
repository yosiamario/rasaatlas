export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="place-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton media" />
          <div className="skeleton line" />
          <div className="skeleton line short" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div aria-hidden="true">
      <div className="skeleton" style={{ aspectRatio: '21 / 9', minHeight: 240 }} />
      <div className="detail-layout">
        <div>
          <div className="skeleton line" style={{ height: 18, width: '40%' }} />
          <div className="skeleton line" style={{ height: 14, marginTop: 18 }} />
          <div className="skeleton line" style={{ height: 14, width: '85%' }} />
          <div className="skeleton line" style={{ height: 14, width: '70%' }} />
        </div>
        <div className="skeleton" style={{ height: 280 }} />
      </div>
    </div>
  )
}
