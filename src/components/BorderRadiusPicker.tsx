import React, { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';

interface BorderRadiusPickerProps {
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
  onChange: (corner: string, value: number) => void;
  elementId: string;
}

export function BorderRadiusPicker({
  topLeft = 0,
  topRight = 0,
  bottomLeft = 0,
  bottomRight = 0,
  onChange,
  elementId
}: BorderRadiusPickerProps) {
  const [isLinked, setIsLinked] = useState(true);

  const handleUniformChange = (value: number) => {
    if (isLinked) {
      onChange('topLeft', value);
      onChange('topRight', value);
      onChange('bottomLeft', value);
      onChange('bottomRight', value);
    }
  };

  const handleIndividualChange = (corner: string, value: number) => {
    if (isLinked) {
      handleUniformChange(value);
    } else {
      onChange(corner, value);
    }
  };

  const resetAll = () => {
    onChange('topLeft', 0);
    onChange('topRight', 0);
    onChange('bottomLeft', 0);
    onChange('bottomRight', 0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Border Radius</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="p-1 h-auto"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button
            variant={isLinked ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLinked(!isLinked)}
            className="text-xs px-2 py-1 h-auto"
          >
            {isLinked ? "🔗" : "🔓"}
          </Button>
        </div>
      </div>

      {isLinked ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Todos os cantos</Label>
          <Input
            type="number"
            min={0}
            value={topLeft}
            onChange={(e) => handleUniformChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="text-sm"
            placeholder="0"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Superior Esq.</Label>
            <Input
              type="number"
              min={0}
              value={topLeft}
              onChange={(e) => handleIndividualChange('topLeft', Math.max(0, parseInt(e.target.value) || 0))}
              className="text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Superior Dir.</Label>
            <Input
              type="number"
              min={0}
              value={topRight}
              onChange={(e) => handleIndividualChange('topRight', Math.max(0, parseInt(e.target.value) || 0))}
              className="text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Inferior Esq.</Label>
            <Input
              type="number"
              min={0}
              value={bottomLeft}
              onChange={(e) => handleIndividualChange('bottomLeft', Math.max(0, parseInt(e.target.value) || 0))}
              className="text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Inferior Dir.</Label>
            <Input
              type="number"
              min={0}
              value={bottomRight}
              onChange={(e) => handleIndividualChange('bottomRight', Math.max(0, parseInt(e.target.value) || 0))}
              className="text-sm"
              placeholder="0"
            />
          </div>
        </div>
      )}
    </div>
  );
}