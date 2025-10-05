import React, { useEffect, useState } from 'react';
import { Group, Path, Text } from 'react-konva';
// @ts-ignore
import { iconPaths } from './icon-paths.js';

interface KonvaIconRendererProps {
  iconName: string;
  width: number;
  height: number;
  fill: string;
}

const KonvaIconRenderer: React.FC<KonvaIconRendererProps> = ({ iconName, width, height, fill }) => {
  const [pathData, setPathData] = useState<string[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (iconName && iconPaths[iconName]) {
      setPathData(iconPaths[iconName]);
      setError(false);
    } else {
      console.warn(`Icon "${iconName}" not found in iconPaths.`);
      setError(true);
    }
  }, [iconName]);

  if (error || pathData.length === 0) {
    return <Text text="?" fontSize={width * 0.8} fill="red" align="center" verticalAlign="middle" width={width} height={height} />;
  }

  return (
    <Group>
      {pathData.map((path, index) => (
        <Path 
            key={index} 
            data={path} 
            fill={fill} 
            scaleX={width / 16} 
            scaleY={height / 16} 
        />
      ))}
    </Group>
  );
};

export default KonvaIconRenderer;