import React, { useState, useEffect } from 'react';
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
  const getMinimumSize = (elementType?: string) => {
    switch (elementType) {
      case 'icon': return 14;
      case 'line': return 2;
      default: return 5;
    }
  };

  const [widthStr, setWidthStr] = useState(String(Math.round(element.width)));
  const [heightStr, setHeightStr] = useState(String(Math.round(element.height)));

  useEffect(() => {
    if (document.activeElement?.id !== 'width-input') {
        setWidthStr(String(Math.round(element.width)));
    }
  }, [element.width]);

  useEffect(() => {
    if (document.activeElement?.id !== 'height-input') {
        setHeightStr(String(Math.round(element.height)));
    }
  }, [element.height]);

  const parseAndValidate = (property: 'width' | 'height', value: string) => {
    let numValue: number;
    const minSize = getMinimumSize(element.type);

    if (value.includes('%') && canvasDimensions) {
      const percentValue = parseFloat(value.replace('%', ''));
      if (!isNaN(percentValue)) {
        const dimension = property === 'width' ? canvasDimensions.width : canvasDimensions.height;
        numValue = (percentValue / 100) * dimension;
      } else {
        return null; // Invalid percentage
      }
    } else {
      numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return null; // Not a number
      }
    }

    let validValue = numValue;
    if (property === 'width') {
      validValue = Math.max(minSize, Math.min(canvasDimensions?.width ?? Infinity, numValue));
    } else if (property === 'height') {
      validValue = Math.max(minSize, Math.min(canvasDimensions?.height ?? Infinity, numValue));
    }
    return validValue;
  };

  const handleDimensionChange = (property: 'width' | 'height', value: string) => {
    if (property === 'width') {
      setWidthStr(value);
    } else {
      setHeightStr(value);
    }

    if (value.trim() === '') return; // Allow empty input while typing

    const validValue = parseAndValidate(property, value);
    if (validValue !== null) {
      onChange(property, validValue);
    }
  };

  const handleBlur = (property: 'width' | 'height') => {
    const value = property === 'width' ? widthStr : heightStr;
    if (value.trim() === '') {
      onChange(property, 1);
    } else {
      const validValue = parseAndValidate(property, value);
      if (validValue === null) {
        // If value is invalid on blur (e.g., "abc"), set to 1
        onChange(property, 1);
      } else {
        // If value is valid, ensure it's re-sent to parent to be sure
        onChange(property, validValue);
      }
    }
  };

  const handlePosChange = (property: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    let validValue = numValue;
    if (canvasDimensions) {
        if (property === 'x') {
            validValue = Math.max(0, Math.min(canvasDimensions.width - element.width, numValue));
        } else { // 'y'
            validValue = Math.max(0, Math.min(canvasDimensions.height - element.height, numValue));
        }
    }
    onChange(property, validValue);
  };


  return (
    <div className="space-y-3">
      <Label className="text-sm">Posição e Dimensões</Label>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">X (px)</Label>
          <Input
            type="number"
            min="0"
            max={canvasDimensions ? canvasDimensions.width - element.width : undefined}
            step="1"
            value={Math.round(element.x)}
            onChange={(e) => handlePosChange('x', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Y (px)</Label>
          <Input
            type="number"
            min="0"
            max={canvasDimensions ? canvasDimensions.height - element.height : undefined}
            step="1"
            value={Math.round(element.y)}
            onChange={(e) => handlePosChange('y', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Largura (px ou %)</Label>
          <Input
            id="width-input"
            type="text"
            value={widthStr}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
            onBlur={() => handleBlur('width')}
            className="mt-1"
            placeholder="100 ou 50%"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Altura (px ou %)</Label>
          <Input
            id="height-input"
            type="text"
            value={heightStr}
            onChange={(e) => handleDimensionChange('height', e.target.value)}
            onBlur={() => handleBlur('height')}
            className="mt-1"
            placeholder="100 ou 50%"
          />
        </div>
      </div>
    </div>
  );
}
