import React from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TextAlignPickerProps {
  value: 'left' | 'center' | 'right';
  onChange: (align: 'left' | 'center' | 'right') => void;
}

export function TextAlignPicker({ value, onChange }: TextAlignPickerProps) {
  const alignOptions = [
    { value: 'left' as const, icon: AlignLeft, label: 'Esquerda' },
    { value: 'center' as const, icon: AlignCenter, label: 'Centro' },
    { value: 'right' as const, icon: AlignRight, label: 'Direita' },
  ];

  return (
    <div>
      <Label className="text-sm">Alinhamento do Texto</Label>
      <div className="flex gap-1 mt-1">
        {alignOptions.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(option.value)}
            className="flex-1"
            title={option.label}
          >
            <option.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}