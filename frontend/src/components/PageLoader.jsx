import React from 'react';

/**
 * Skeleton shimmer block — pass width/height/borderRadius as inline style.
 */
export const Skeleton = ({ style = {}, className = '' }) => (
  <div className={`skeleton ${className}`} style={style} />
);

/**
 * Skeleton for a stat card (matches .stat-card-premium shape)
 */
export const StatCardSkeleton = () => (
  <div className="stat-card-premium" style={{ cursor: 'default' }}>
    <div className="stat-card-shine" />
    <div className="stat-card-glow" />
    <div className="stat-card-top">
      <Skeleton style={{ width: '55%', height: 14, borderRadius: 6 }} />
      <Skeleton style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0 }} />
    </div>
    <Skeleton style={{ width: '60%', height: 38, borderRadius: 8, margin: '0.5rem 0' }} />
    <Skeleton style={{ width: '40%', height: 12, borderRadius: 6 }} />
    <div className="stat-card-bar" style={{ opacity: 0.3 }} />
  </div>
);

/**
 * Skeleton for a data table row
 */
export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: '0.9rem 1.25rem' }}>
        <Skeleton style={{ width: `${60 + Math.random() * 30}%`, height: 13, borderRadius: 6 }} />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton for a glass card (form / info card)
 */
export const CardSkeleton = ({ lines = 4, style = {} }) => (
  <div className="glass-card" style={style}>
    <Skeleton style={{ width: '45%', height: 18, borderRadius: 8, marginBottom: '1.5rem' }} />
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} style={{ marginBottom: '1.2rem' }}>
        <Skeleton style={{ width: '30%', height: 11, borderRadius: 4, marginBottom: 8 }} />
        <Skeleton style={{ width: '100%', height: 40, borderRadius: 10 }} />
      </div>
    ))}
    <Skeleton style={{ width: '100%', height: 44, borderRadius: 10, marginTop: '0.5rem' }} />
  </div>
);

/**
 * Full-page suspense fallback — shown while lazy chunks load
 */
export const PageLoader = () => (
  <div className="page-loader-wrap">
    <div className="page-loader-bar">
      <div className="page-loader-fill" />
    </div>
  </div>
);

export default PageLoader;
