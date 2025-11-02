import React from 'react';
// @ts-ignore
import { iconPaths } from './icon-paths.js';

interface UIIconRendererProps {
  iconName: string;
  className?: string;
}

const UIIconRenderer: React.FC<UIIconRendererProps> = ({ iconName, className }) => {
  const pathData = iconPaths[iconName];

  if (!pathData) {
    return <span className={className}>?</span>;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      className={className}
      fill="currentColor"
    >
      {pathData.map((path, index) => (
        <path key={index} d={path} />
      ))}
    </svg>
  );
};

export default UIIconRenderer;
