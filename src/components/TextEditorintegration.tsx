import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

// Using the same WireframeElement interface from WireframeEditor
interface WireframeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  backgroundColor?: string;
  textLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  zIndex?: number;
  borderWidth?: number;
  borderColor?: string;
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  parentId?: string;
  name?: string;
}

interface TextEditorIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
  element: WireframeElement | null;
  onApplyChanges: (changes: Partial<WireframeElement>) => void;
}

export function TextEditorIntegration({ isOpen, onClose, element, onApplyChanges }: TextEditorIntegrationProps) {
  const [text, setText] = useState(element?.text || '');

  useEffect(() => {
    if (isOpen && element) {
      setText(element.text || '');
    }
  }, [isOpen, element]);

  const handleApply = () => {
    onApplyChanges({ text });
    onClose();
  };

  if (!element) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editor Inteligente de Texto</DialogTitle>
          <DialogDescription>
            Modifique o conteúdo do seu texto abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="text-content">Conteúdo</Label>
            <Textarea
              id="text-content"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px]"
              placeholder="Digite seu texto aqui..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleApply}>Aplicar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
