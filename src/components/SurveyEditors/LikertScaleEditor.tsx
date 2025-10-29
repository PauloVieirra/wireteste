import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface LikertScaleEditorProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  startLabel: string;
  onStartLabelChange: (label: string) => void;
  middleLabel: string;
  onMiddleLabelChange: (label: string) => void;
  endLabel: string;
  onEndLabelChange: (label: string) => void;
}

export function LikertScaleEditor({
  scale, onScaleChange,
  startLabel, onStartLabelChange,
  middleLabel, onMiddleLabelChange,
  endLabel, onEndLabelChange
}: LikertScaleEditorProps) {
  return (
    <div className="pl-4 mt-4 space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Escala</Label>
          <Select value={scale.toString()} onValueChange={(val) => onScaleChange(parseInt(val))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Pontos</SelectItem>
              <SelectItem value="5">5 Pontos</SelectItem>
              <SelectItem value="7">7 Pontos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Rótulo Inicial (Ponto 1)</Label>
          <Input value={startLabel} onChange={(e) => onStartLabelChange(e.target.value)} placeholder="Ex: Discordo Totalmente" />
        </div>
        {scale > 3 && (
          <div className="space-y-2">
            <Label>Rótulo Central (Ponto {Math.ceil(scale / 2)})</Label>
            <Input value={middleLabel} onChange={(e) => onMiddleLabelChange(e.target.value)} placeholder="Ex: Neutro" />
          </div>
        )}
        <div className="space-y-2">
          <Label>Rótulo Final (Ponto {scale})</Label>
          <Input value={endLabel} onChange={(e) => onEndLabelChange(e.target.value)} placeholder="Ex: Concordo Totalmente" />
        </div>
      </div>
    </div>
  );
}
