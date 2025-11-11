import React from 'react';
import { Label } from './ui/label';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const SWATCH_COLORS = [
  'transparent',
  '#ffffff',
  '#f8f9fa', 
  '#e9ecef',
  '#dee2e6',
  '#ced4da',
  '#adb5bd',
  '#6c757d',
  '#495057',
  '#343a40',
  '#212529',
  '#000000'
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-sm">{label}</Label>}
      <div className="grid grid-cols-6 gap-2 p-2 border border-border rounded">
        {SWATCH_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-7 h-7 rounded border-2 hover:scale-110 transition-transform relative ${
              value === color ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-1' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
            onClick={() => onChange(color)}
            title={color}
          >
            {color === 'transparent' && (
              <div 
                className="absolute inset-0 bg-red-500"
                style={{
                  clipPath: 'polygon(0 0, 2px 0, 100% calc(100% - 2px), 100% 100%, calc(100% - 2px) 100%, 0 2px, 0 0)',
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
