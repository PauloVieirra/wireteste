import React from 'react';
import { Label } from './ui/label';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const GRAYSCALE_COLORS = [
  '#ffffff', // White
  '#f8f9fa', 
  '#e9ecef',
  '#dee2e6',
  '#ced4da',
  '#adb5bd',
  '#6c757d',
  '#495057',
  '#343a40',
  '#212529',
  '#000000'  // Black
];

export function ColorPicker({ value, onChange, label = "Cor de fundo" }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-sm">{label}</Label>}
      <div className="grid grid-cols-6 gap-1 p-2 border border-border rounded">
        {GRAYSCALE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
              value === color ? 'border-blue-500' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Cor selecionada: {value}
      </div>
    </div>
  );
}