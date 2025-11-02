import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Edit, Check } from 'lucide-react';

interface BorderRadiusPickerProps {
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
  onChange: (changes: { [key: string]: number }) => void;
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
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const allSame = topLeft === topRight && topLeft === bottomLeft && topLeft === bottomRight;
    if (isLinked) {
        if (allSame) {
            setDisplayValue(String(topLeft));
        } else {
            setDisplayValue(`${topLeft}, ${topRight}, ${bottomLeft}, ${bottomRight}`);
        }
    }
    setIsLinked(allSame);
  }, [topLeft, topRight, bottomLeft, bottomRight]);

  const handleUniformChange = (value: number) => {
    onChange({
      topLeft: value,
      topRight: value,
      bottomLeft: value,
      bottomRight: value,
    });
  };

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayValue(value);
    
    const num = parseInt(value, 10);
    if (value === '' || (!isNaN(num) && String(num) === value)) {
      handleUniformChange(num || 0);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Border Radius</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLinked(!isLinked)}
            className="text-xs px-2 py-1 h-auto"
          >
            {isLinked ? <Edit className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isLinked ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Todos os cantos</Label>
          <Input
            type="text"
            value={displayValue}
            onChange={handleDisplayChange}
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
              onChange={(e) => onChange({ topLeft: Math.max(0, parseInt(e.target.value) || 0) })}
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
              onChange={(e) => onChange({ topRight: Math.max(0, parseInt(e.target.value) || 0) })}
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
              onChange={(e) => onChange({ bottomLeft: Math.max(0, parseInt(e.target.value) || 0) })}
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
              onChange={(e) => onChange({ bottomRight: Math.max(0, parseInt(e.target.value) || 0) })}
              className="text-sm"
              placeholder="0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
