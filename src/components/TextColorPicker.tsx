import React, { useState } from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Palette } from 'lucide-react';

interface TextColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function TextColorPicker({ value, onChange }: TextColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // System color palette based on CSS variables
  const systemColors = [
    { name: 'Texto padrão', value: 'var(--foreground)', class: 'text-foreground' },
    { name: 'Texto secundário', value: 'var(--muted-foreground)', class: 'text-muted-foreground' },
    { name: 'Primário', value: 'var(--primary)', class: 'text-primary' },
    { name: 'Secundário', value: 'var(--secondary-foreground)', class: 'text-secondary-foreground' },
    { name: 'Destrutivo', value: 'var(--destructive)', class: 'text-destructive' },
    { name: 'Preto', value: '#000000', class: 'text-black' },
    { name: 'Cinza escuro', value: '#374151', class: 'text-gray-700' },
    { name: 'Cinza médio', value: '#6B7280', class: 'text-gray-500' },
    { name: 'Cinza claro', value: '#9CA3AF', class: 'text-gray-400' },
    { name: 'Branco', value: '#FFFFFF', class: 'text-white' },
  ];

  const currentColor = systemColors.find(c => c.value === value) || systemColors[0];

  return (
    <div>
      <Label className="text-sm">Cor do Texto</Label>
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
            {systemColors.map((color) => (
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