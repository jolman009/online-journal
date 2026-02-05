import { usePullToRefresh } from '../hooks/usePullToRefresh';

export default function PullToRefresh({ onRefresh, children }) {
  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh(onRefresh);

  return (
    <div className="pull-to-refresh" {...handlers}>
      <div
        className="pull-to-refresh__indicator"
        style={{
          transform: `translateY(${pullDistance - 50}px)`,
          opacity: pullProgress,
        }}
      >
        <div
          className={`pull-to-refresh__spinner${isRefreshing ? ' pull-to-refresh__spinner--spinning' : ''}`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${pullProgress * 360}deg)`,
          }}
        >
          ↻
        </div>
        <span className="pull-to-refresh__text">
          {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
      {children}
    </div>
  );
}
