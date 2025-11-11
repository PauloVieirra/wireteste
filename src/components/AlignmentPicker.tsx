import React from 'react';
import { Button } from './ui/button';

interface AlignmentPickerProps {
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems: 'flex-start' | 'center' | 'flex-end';
  onChange: (props: { justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between', alignItems?: 'flex-start' | 'center' | 'flex-end' }) => void;
}

export function AlignmentPicker({ justifyContent, alignItems, onChange }: AlignmentPickerProps) {
  const alignments: { jc: 'flex-start' | 'center' | 'flex-end', ai: 'flex-start' | 'center' | 'flex-end' }[] = [
    { ai: 'flex-start', jc: 'flex-start' }, { ai: 'flex-start', jc: 'center' }, { ai: 'flex-start', jc: 'flex-end' },
    { ai: 'center',    jc: 'flex-start' }, { ai: 'center',    jc: 'center' }, { ai: 'center',    jc: 'flex-end' },
    { ai: 'flex-end',   jc: 'flex-start' }, { ai: 'flex-end',   jc: 'center' }, { ai: 'flex-end',   jc: 'flex-end' },
  ];

  return (
    <div className="grid grid-cols-3 gap-1 w-24">
      {alignments.map((align, index) => (
        <Button
          key={index}
          variant={justifyContent === align.jc && alignItems === align.ai ? 'secondary' : 'ghost'}
          size="icon"
          className="w-8 h-8"
          onClick={() => onChange({ justifyContent: align.jc, alignItems: align.ai })}
        >
          <div
            className="w-4 h-4 border border-border rounded-sm flex"
            style={{
                justifyContent: align.jc,
                alignItems: align.ai
            }}
          >
            <div className="w-1 h-1 bg-foreground rounded-full"></div>
          </div>
        </Button>
      ))}
    </div>
  );
}
