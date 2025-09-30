import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';

interface BorderWidthPickerProps {
  value: number;
  onChange: (width: number) => void;
}

export function BorderWidthPicker({ value, onChange }: BorderWidthPickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value);
    if (isNaN(width)) {
      onChange(0);
    } else {
      onChange(Math.max(0, width)); // Aceita qualquer valor acima de 0
    }
  };

  return (
    <div>
      <Label className="text-sm">Espessura da Borda (px)</Label>
      <div className="mt-1 flex items-center gap-2">
        <Input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={handleChange}
          className="w-20"
          placeholder="0"
        />
        <span className="text-xs text-muted-foreground">px</span>
      </div>
    </div>
  );
}