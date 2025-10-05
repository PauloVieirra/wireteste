import React, { useEffect, useState } from 'react';
import { Group, Path, Text } from 'react-konva';
import { SVGPathData, parseSVG } from 'svg-path-parser';

interface KonvaSvgProps {
  src: string;
  width: number;
  height: number;
  fillColor?: string;
}

export const KonvaSvg: React.FC<KonvaSvgProps> = ({ src, width, height, fillColor }) => {
  const [paths, setPaths] = useState<SVGPathData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setPaths([]);
      setError(null);
      return;
    }

    const parseSvgContent = (svg: string) => {
      try {
        const parsed = parseSVG(svg);
        if (!parsed || !parsed.paths) {
            throw new Error("Invalid SVG content");
        }
        setPaths(parsed.paths);
        setError(null);
      } catch (e) {
        console.error('Error parsing SVG:', e);
        setError('Error parsing SVG');
      }
    };

    if (src.trim().startsWith('<svg')) {
      parseSvgContent(src);
    } else {
      fetch(src)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.text();
        })
        .then(svg => {
          parseSvgContent(svg);
        })
        .catch(err => {
          console.error('Error fetching SVG:', err);
          setError('Error fetching SVG');
        });
    }
  }, [src]);

  if (error) {
    return <Text text="?" fontSize={width * 0.8} fill="red" align="center" verticalAlign="middle" />;
  }

  if (paths.length === 0) {
    return null;
  }

  return (
    <Group>
      {paths.map((path, i) => (
        <Path
          key={i}
          data={path.d}
          fill={fillColor || path.fill}
          scaleX={width / path.width}
          scaleY={height / path.height}
        />
      ))}
    </Group>
  );
};