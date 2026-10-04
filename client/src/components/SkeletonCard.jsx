export default function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-img" />
      <div className="card-body">
        <div className="row-between">
          <div className="skeleton skeleton-tag" />
          <div className="skeleton skeleton-rating" />
        </div>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-price" />
      </div>
    </div>
  );
}
