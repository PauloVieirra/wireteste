import React, { useState } from 'react';

interface ResizeDebuggerProps {
  element: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  zoom: number;
  onResize: (newWidth: number, newHeight: number) => void;
}

export function ResizeDebugger({ element, zoom, onResize }: ResizeDebuggerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [initialMouse, setInitialMouse] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setInitialMouse({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: element.width, height: element.height });
    
    console.log('Resize debug - starting', { mouse: { x: e.clientX, y: e.clientY }, size: { width: element.width, height: element.height } });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = (e.clientX - initialMouse.x) / zoom;
    const deltaY = (e.clientY - initialMouse.y) / zoom;
    
    const newWidth = Math.max(10, initialSize.width + deltaX);
    const newHeight = Math.max(10, initialSize.height + deltaY);
    
    console.log('Resize debug - moving', { deltaX, deltaY, newWidth, newHeight });
    
    onResize(newWidth, newHeight);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    console.log('Resize debug - ended');
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, initialMouse, initialSize, zoom]);

  return (
    <div
      className="absolute w-4 h-4 bg-red-500 border-2 border-white cursor-se-resize rounded"
      style={{
        left: (element.x + element.width) * zoom - 8,
        top: (element.y + element.height) * zoom - 8,
        zIndex: 1000,
      }}
      onMouseDown={handleMouseDown}
      title="Debug Resize Handle"
    />
  );
}