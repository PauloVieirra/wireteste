import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';

interface GridConfig {
  enabled: boolean;
  columns: number;
  gap: number;
  margin: number;
  color: 'red' | 'purple' | 'green';
  opacity: number;
}

interface GridSettingsProps {
  config: GridConfig;
  onChange: (config: GridConfig) => void;
}

export function GridSettings({ config, onChange }: GridSettingsProps) {
  const updateConfig = (updates: Partial<GridConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Sistema de Grid</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Ativar grid</Label>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
          />
        </div>
        
        {config.enabled && (
          <>
            {/* Grid settings enabled */}
            <div>
              <Label className="text-xs">Colunas</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={config.columns}
                onChange={(e) => updateConfig({ columns: parseInt(e.target.value) || 12 })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-xs">Gap (px)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.gap}
                onChange={(e) => updateConfig({ gap: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-xs">Margem (px)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.margin}
                onChange={(e) => updateConfig({ margin: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Transparência: {Math.round(config.opacity * 100)}%</Label>
              <Slider
                value={[config.opacity]}
                onValueChange={([opacity]) => updateConfig({ opacity })}
                min={0.1}
                max={0.2}
                step={0.1}
                className="mt-2"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}