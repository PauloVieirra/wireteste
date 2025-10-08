import React from 'react';
import { Rect, Group } from 'react-konva';

const Frame = ({
  x,
  y,
  width,
  height,
  onSelect,
  isSelected,
  children,
  borderTopLeftRadius = 0,
  borderTopRightRadius = 0,
  borderBottomLeftRadius = 0,
  borderBottomRightRadius = 0,
}) => {
  const handleSelect = () => {
    onSelect();
  };

  return (
    <Group x={x} y={y} draggable>
      <Rect
        width={width}
        height={height}
        fill={isSelected ? 'rgba(173, 216, 230, 0.3)' : 'transparent'}
        stroke={isSelected ? 'lightblue' : 'lightgray'}
        strokeWidth={2}
        dash={[10, 5]}
        onClick={handleSelect}
        cornerRadius={[
          borderTopLeftRadius,
          borderTopRightRadius,
          borderBottomRightRadius,
          borderBottomLeftRadius,
        ]}
      />
      {children}
    </Group>
  );
};

export default Frame;