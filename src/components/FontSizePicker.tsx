import React, { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';

interface FontSizePickerProps {
  value: number | string; // Can be pixel value or text level
  onChange: (value: number | string) => void;
  mode: 'preset' | 'custom';
  onModeChange: (mode: 'preset' | 'custom') => void;
}

const FONT_LEVELS = [
  { value: 'h1', label: 'Título 1 (H1)', size: 24 },
  { value: 'h2', label: 'Título 2 (H2)', size: 20 },
  { value: 'h3', label: 'Título 3 (H3)', size: 18 },
  { value: 'h4', label: 'Título 4 (H4)', size: 16 },
  { value: 'h5', label: 'Título 5 (H5)', size: 14 },
  { value: 'h6', label: 'Título 6 (H6)', size: 12 },
  { value: 'p', label: 'Parágrafo (P)', size: 14 },
] as const;

export function FontSizePicker({ value, onChange, mode, onModeChange }: FontSizePickerProps) {
  const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value) || 14;
    onChange(Math.max(8, Math.min(size, 72))); // Limit between 8px and 72px
  };

  const handlePresetChange = (level: string) => {
    onChange(level);
  };

  return (
    <div>
      <Label className="text-sm">Tamanho da Fonte</Label>
      
      {/* Mode Toggle */}
      <div className="flex gap-1 mt-1 mb-2">
        <Button
          size="sm"
          variant={mode === 'preset' ? 'default' : 'outline'}
          onClick={() => onModeChange('preset')}
          className="flex-1 text-xs"
        >
          Predefinido
        </Button>
        <Button
          size="sm"
          variant={mode === 'custom' ? 'default' : 'outline'}
          onClick={() => onModeChange('custom')}
          className="flex-1 text-xs"
        >
          Personalizado
        </Button>
      </div>

      {mode === 'preset' ? (
        <Select 
          value={typeof value === 'string' ? value : 'p'} 
          onValueChange={handlePresetChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label} - {level.size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="8"
            max="72"
            step="1"
            value={typeof value === 'number' ? value : (FONT_LEVELS.find(l => l.value === value)?.size || 14)}
            onChange={handleCustomSizeChange}
            className="w-20"
            placeholder="14"
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
      )}
    </div>
  );
}