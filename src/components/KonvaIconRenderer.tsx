import React, { useEffect, useState } from 'react';
import { Path } from 'react-konva';

interface KonvaIconRendererProps {
  iconName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

const KonvaIconRenderer: React.FC<KonvaIconRendererProps> = ({ iconName, x, y, width, height, fill }) => {
  const [pathData, setPathData] = useState<string[]>([]);

  useEffect(() => {
    const fetchIcon = async () => {
      try {
        const iconModule = await import(`./icons/${iconName}.tsx`);
        // This is where the magic needs to happen.
        // I need to get the file content and parse it.
        // For now, I will just log the module.
        console.log(iconModule);
      } catch (error) {
        console.error(`Error loading icon ${iconName}:`, error);
      }
    };

    fetchIcon();
  }, [iconName]);

  return (
    <>
      {pathData.map((path, index) => (
        <Path key={index} data={path} fill={fill} x={x} y={y} width={width} height={height} scaleX={width / 16} scaleY={height / 16} />
      ))}
    </>
  );
};

export default KonvaIconRenderer;
