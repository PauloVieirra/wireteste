import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';

interface DimensionEditorProps {
  element: {
    x: number;
    y: number;
    width: number;
    height: number;
    type?: string;
  };
  onChange: (property: 'x' | 'y' | 'width' | 'height', value: number) => void;
  canvasDimensions?: { width: number; height: number };
}

export function DimensionEditor({ element, onChange, canvasDimensions }: DimensionEditorProps) {
  // Get minimum size based on element type
  const getMinimumSize = (elementType?: string) => {
    switch (elementType) {
      case 'icon': return 14; // Minimum 14px for icons
      case 'line': return 2;  // Very small minimum for lines
      default: return 5;      // General minimum for other elements
    }
  };

  const handleValueChange = (property: 'x' | 'y' | 'width' | 'height', value: string) => {
    // Allow empty string for editing purposes
    if (value === '') {
      return;
    }
    
    let numValue: number;
    
    // Check if value contains % for width/height
    if ((property === 'width' || property === 'height') && value.includes('%')) {
      const percentValue = parseFloat(value.replace('%', ''));
      if (!isNaN(percentValue) && canvasDimensions) {
        // Convert percentage to pixels
        const dimension = property === 'width' ? canvasDimensions.width : canvasDimensions.height;
        numValue = (percentValue / 100) * dimension;
      } else {
        return;
      }
    } else {
      numValue = parseFloat(value);
      if (isNaN(numValue)) return;
    }
    
    // Apply constraints based on canvas dimensions and element type
    let validValue = numValue;
    const minSize = getMinimumSize(element.type);
    
    if (property === 'width' && canvasDimensions) {
      validValue = Math.max(minSize, Math.min(canvasDimensions.width, numValue));
    } else if (property === 'height' && canvasDimensions) {
      validValue = Math.max(minSize, Math.min(canvasDimensions.height, numValue));
    } else if (property === 'x' && canvasDimensions) {
      validValue = Math.max(0, Math.min(canvasDimensions.width - element.width, numValue));
    } else if (property === 'y' && canvasDimensions) {
      validValue = Math.max(0, Math.min(canvasDimensions.height - element.height, numValue));
    } else if (property === 'width' || property === 'height') {
      validValue = Math.max(minSize, numValue);
    } else {
      validValue = Math.max(0, numValue);
    }
    
    // Use requestAnimationFrame to ensure smooth updates
    requestAnimationFrame(() => {
      onChange(property, validValue);
    });
  };
  
  // Convert width/height to percentage display when appropriate
  const getDisplayValue = (property: 'x' | 'y' | 'width' | 'height', value: number) => {
    if ((property === 'width' || property === 'height') && canvasDimensions) {
      const dimension = property === 'width' ? canvasDimensions.width : canvasDimensions.height;
      const percentage = Math.round((value / dimension) * 100);
      // Show percentage if it's a round number, otherwise show pixels
      if (Math.abs((percentage / 100) * dimension - value) < 1) {
        return `${percentage}%`;
      }
    }
    return Math.round(value).toString();
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm">Posição e Dimensões</Label>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">X (px)</Label>
          <Input
            type="number"
            step="1"
            value={Math.round(element.x)}
            onChange={(e) => handleValueChange('x', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Y (px)</Label>
          <Input
            type="number"
            step="1"
            value={Math.round(element.y)}
            onChange={(e) => handleValueChange('y', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Largura (px ou %)</Label>
          <Input
            type="text"
            value={getDisplayValue('width', element.width)}
            onChange={(e) => handleValueChange('width', e.target.value)}
            className="mt-1"
            placeholder="100 ou 50%"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Altura (px ou %)</Label>
          <Input
            type="text"
            value={getDisplayValue('height', element.height)}
            onChange={(e) => handleValueChange('height', e.target.value)}
            className="mt-1"
            placeholder="100 ou 50%"
          />
        </div>
      </div>
    </div>
  );
}