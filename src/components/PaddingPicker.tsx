import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Link, Link2Off } from 'lucide-react';

interface PaddingPickerProps {
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  onChange: (changes: { [key: string]: number | undefined }) => void;
}

export function PaddingPicker({
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  onChange,
}: PaddingPickerProps) {
  const [isLinked, setIsLinked] = useState(true);
  
  const pT = paddingTop ?? padding ?? 0;
  const pR = paddingRight ?? padding ?? 0;
  const pB = paddingBottom ?? padding ?? 0;
  const pL = paddingLeft ?? padding ?? 0;

  useEffect(() => {
    const allSame = pT === pR && pT === pB && pT === pL;
    setIsLinked(allSame);
  }, [pT, pR, pB, pL]);

  const handleUniformChange = (value: number) => {
    onChange({
      paddingTop: value,
      paddingRight: value,
      paddingBottom: value,
      paddingLeft: value,
      padding: value, // also update the legacy property
    });
  };

  const handleIndividualChange = (side: string, value: number) => {
    onChange({
        [side]: value,
        padding: undefined, // Unset legacy padding when using individual values
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Padding</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsLinked(!isLinked)}
          title={isLinked ? "Set individual paddings" : "Set all paddings"}
        >
          {isLinked ? <Link2Off className="w-4 h-4" /> : <Link className="w-4 h-4" />}
        </Button>
      </div>

      {isLinked ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Todos os lados</Label>
          <Input
            type="number"
            min={0}
            value={pT}
            onChange={(e) => handleUniformChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="text-sm"
            placeholder="0"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Superior</Label>
            <Input
              type="number"
              min={0}
              value={pT}
              onChange={(e) => handleIndividualChange('paddingTop', Math.max(0, parseInt(e.target.value) || 0))}
              className="text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Direito</Label>
            <Input
              type="number"
              min={0}
              value={pR}
              onChange={(e) => handleIndividualChange('paddingRight', Math.max(0, parseInt(e.target.value) || 0))}
              className="text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Inferior</Label>
            <Input
              type="number"
              min={0}
              value={pB}
              onChange={(e) => handleIndividualChange('paddingBottom', Math.max(0, parseInt(e.target.value) || 0))}
              className="text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Esquerdo</Label>
            <Input
              type="number"
              min={0}
              value={pL}
              onChange={(e) => handleIndividualChange('paddingLeft', Math.max(0, parseInt(e.target.value) || 0))}
              className="text-sm"
              placeholder="0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
