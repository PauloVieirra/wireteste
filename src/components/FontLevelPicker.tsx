import React from 'react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface FontLevelPickerProps {
  value: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  onChange: (level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p') => void;
  resolution?: 'mobile' | 'tablet' | 'desktop';
  label?: string;
}

const getFontLevels = (resolution: 'mobile' | 'tablet' | 'desktop' = 'desktop') => {
  const sizes = {
    desktop: {
      h1: '40px', h2: '32px', h3: '28px', h4: '24px', h5: '20px', h6: '16px', p: '16px'
    },
    tablet: {
      h1: '32px', h2: '28px', h3: '24px', h4: '20px', h5: '18px', h6: '16px', p: '15px'
    },
    mobile: {
      h1: '28px', h2: '24px', h3: '20px', h4: '18px', h5: '16px', h6: '14px', p: '14px'
    }
  };

  return [
    { value: 'h1', label: `Título 1 (${sizes[resolution].h1})` },
    { value: 'h2', label: `Título 2 (${sizes[resolution].h2})` },
    { value: 'h3', label: `Título 3 (${sizes[resolution].h3})` },
    { value: 'h4', label: `Título 4 (${sizes[resolution].h4})` },
    { value: 'h5', label: `Título 5 (${sizes[resolution].h5})` },
    { value: 'h6', label: `Título 6 (${sizes[resolution].h6})` },
    { value: 'p', label: `Parágrafo (${sizes[resolution].p})` },
  ] as const;
};

export function FontLevelPicker({ value, onChange, resolution = 'desktop', label = "Nível do texto" }: FontLevelPickerProps) {
  const fontLevels = getFontLevels(resolution);
  
  return (
    <div className="space-y-2">
      {label && <Label className="text-sm">{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fontLevels.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}