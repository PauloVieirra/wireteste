import React from 'react';

interface GridConfig {
  enabled: boolean;
  columns: number;
  gap: number;
  margin: number;
  color: 'red';
  opacity: number;
}

interface GridOverlayProps {
  gridConfig: GridConfig;
  width: number; // The width of the wireframe canvas
}

const GridOverlay: React.FC<GridOverlayProps> = ({ gridConfig, width }) => {
  if (!gridConfig.enabled) {
    return null;
  }

  const { columns, gap, margin, opacity } = gridConfig;

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${width}px`,
    height: '100%',
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
    padding: `0 ${margin}px`,
    pointerEvents: 'none', // This is crucial
    zIndex: 1000, // Ensure it's on top
  };

  const columnStyle: React.CSSProperties = {
    boxShadow: `inset 0 0 0 100vh rgba(255, 0, 0, ${opacity || 0.1})`,
  };

  return (
    <div style={gridStyle}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} style={columnStyle}></div>
      ))}
    </div>
  );
};

export default GridOverlay;