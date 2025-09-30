import React, { useState } from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface BorderColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function BorderColorPicker({ value, onChange }: BorderColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // System color palette for borders
  const borderColors = [
    { name: 'Cinza padrão', value: '#d1d5db', class: 'border-gray-300' },
    { name: 'Preto', value: '#000000', class: 'border-black' },
    { name: 'Cinza escuro', value: '#374151', class: 'border-gray-700' },
    { name: 'Cinza médio', value: '#6B7280', class: 'border-gray-500' },
    { name: 'Cinza claro', value: '#9CA3AF', class: 'border-gray-400' },
    { name: 'Primário', value: 'var(--primary)', class: 'border-primary' },
    { name: 'Secundário', value: 'var(--muted-foreground)', class: 'border-muted-foreground' },
    { name: 'Destrutivo', value: 'var(--destructive)', class: 'border-destructive' },
    { name: 'Branco', value: '#FFFFFF', class: 'border-white' },
    { name: 'Transparente', value: 'transparent', class: 'border-transparent' },
  ];

  const currentColor = borderColors.find(c => c.value === value) || borderColors[0];

  return (
    <div>
      <Label className="text-sm">Cor da Borda</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start mt-1"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-border"
                style={{ backgroundColor: currentColor.value }}
              />
              <span>{currentColor.name}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="grid grid-cols-2 gap-2">
            {borderColors.map((color) => (
              <Button
                key={color.value}
                variant={value === color.value ? "default" : "ghost"}
                size="sm"
                className="justify-start h-auto p-2"
                onClick={() => {
                  onChange(color.value);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-xs truncate">{color.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}