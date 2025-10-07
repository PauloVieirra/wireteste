
import React, { useState } from 'react';
import { Rect, Group } from 'react-konva';

const Frame = ({ x, y, width, height, onSelect, isSelected, children }) => {
  const [fillColor, setFillColor] = useState(null);

  const handleSelect = () => {
    onSelect();
  };

  return (
    <Group x={x} y={y} draggable>
      <Rect
        width={width}
        height={height}
        fill={isSelected ? 'rgba(173, 216, 230, 0.3)' : fillColor || 'transparent'}
        stroke={isSelected ? 'lightblue' : 'lightgray'}
        strokeWidth={2}
        dash={[10, 5]}
        onClick={handleSelect}
      />
      {children}
    </Group>
  );
};

export default Frame;
