import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Toggle } from './ui/toggle';
import { Bold, Italic, Underline, Strikethrough, Type, Edit3 } from 'lucide-react';

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
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomLeft?: number;
  borderRadiusBottomRight?: number;
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  parentId?: string;
  name?: string;
  buttonStyle?: 'primary' | 'secondary' | 'ghost' | 'link' | 'outline' | 'circle';
  buttonVariant?: 'default' | 'warning' | 'positive' | 'attention' | 'destructive';
  // Advanced text formatting properties
  fontWeight?: 'normal' | 'bold';
  fontFamily?: 'inter' | 'roboto' | 'arial' | 'helvetica' | 'times' | 'georgia' | 'monospace';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
}

interface TextEditorProps {
  isOpen: boolean;
  onClose: () => void;
  element: WireframeElement | null;
  onApplyChanges: (changes: Partial<WireframeElement>) => void;
}

export function TextEditor({ isOpen, onClose, element, onApplyChanges }: TextEditorProps) {
  const [text, setText] = useState(element?.text || '');
  const [fontFamily, setFontFamily] = useState(element?.fontFamily || 'inter');
  const [fontWeight, setFontWeight] = useState(element?.fontWeight || 'normal');
  const [fontStyle, setFontStyle] = useState(element?.fontStyle || 'normal');
  const [textDecoration, setTextDecoration] = useState(element?.textDecoration || 'none');
  const [textLevel, setTextLevel] = useState(element?.textLevel || 'p');

  // Reset state when element changes
  useEffect(() => {
    if (element) {
      setText(element.text || '');
      setFontFamily(element.fontFamily || 'inter');
      setFontWeight(element.fontWeight || 'normal');
      setFontStyle(element.fontStyle || 'normal');
      setTextDecoration(element.textDecoration || 'none');
      setTextLevel(element.textLevel || 'p');
    }
  }, [element]);

  const handleApply = () => {
    const changes: Partial<WireframeElement> = {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      textLevel
    };
    
    onApplyChanges(changes);
    onClose();
  };

  const handleReset = () => {
    if (element) {
      setText(element.text || '');
      setFontFamily(element.fontFamily || 'inter');
      setFontWeight(element.fontWeight || 'normal');
      setFontStyle(element.fontStyle || 'normal');
      setTextDecoration(element.textDecoration || 'none');
      setTextLevel(element.textLevel || 'p');
    }
  };

  const getPreviewStyle = () => {
    return {
      fontFamily: getFontFamilyCSS(fontFamily),
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      textDecoration: textDecoration,
    };
  };

  const getFontFamilyCSS = (font: string) => {
    switch (font) {
      case 'inter': return '"Inter", system-ui, sans-serif';
      case 'roboto': return '"Roboto", system-ui, sans-serif';
      case 'arial': return 'Arial, sans-serif';
      case 'helvetica': return '"Helvetica Neue", Helvetica, sans-serif';
      case 'times': return '"Times New Roman", Times, serif';
      case 'georgia': return 'Georgia, serif';
      case 'monospace': return '"Fira Code", "Consolas", monospace';
      default: return '"Inter", system-ui, sans-serif';
    }
  };

  const getElementTypeLabel = (level: string) => {
    switch (level) {
      case 'h1': return 'Título 1 (H1)';
      case 'h2': return 'Título 2 (H2)';
      case 'h3': return 'Título 3 (H3)';
      case 'h4': return 'Título 4 (H4)';
      case 'h5': return 'Título 5 (H5)';
      case 'h6': return 'Título 6 (H6)';
      case 'p': return 'Parágrafo (P)';
      default: return 'Parágrafo (P)';
    }
  };

  // Don't render if no element is provided
  if (!element) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Editor de Texto Avançado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Text Content */}
          <div className="space-y-2">
            <Label>Conteúdo do Texto</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite seu texto aqui..."
              className="min-h-[120px] resize-y"
              style={{
                fontFamily: getFontFamilyCSS(fontFamily),
                fontWeight: fontWeight,
                fontStyle: fontStyle,
                textDecoration: textDecoration,
              }}
            />
            <p className="text-xs text-muted-foreground">
              Suporte completo para acentuação e caracteres especiais
            </p>
          </div>

          {/* Text Type */}
          <div className="space-y-2">
            <Label>Tipo de Elemento</Label>
            <Select value={textLevel} onValueChange={setTextLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">Título 1 (H1)</SelectItem>
                <SelectItem value="h2">Título 2 (H2)</SelectItem>
                <SelectItem value="h3">Título 3 (H3)</SelectItem>
                <SelectItem value="h4">Título 4 (H4)</SelectItem>
                <SelectItem value="h5">Título 5 (H5)</SelectItem>
                <SelectItem value="h6">Título 6 (H6)</SelectItem>
                <SelectItem value="p">Parágrafo (P)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label>Família da Fonte</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter (Padrão)</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="arial">Arial</SelectItem>
                <SelectItem value="helvetica">Helvetica</SelectItem>
                <SelectItem value="times">Times New Roman</SelectItem>
                <SelectItem value="georgia">Georgia</SelectItem>
                <SelectItem value="monospace">Monospace</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Typography Controls */}
          <div className="space-y-3">
            <Label>Formatação</Label>
            <div className="flex flex-wrap gap-2">
              <Toggle
                pressed={fontWeight === 'bold'}
                onPressedChange={(pressed) => setFontWeight(pressed ? 'bold' : 'normal')}
                aria-label="Negrito"
                className="flex items-center gap-2"
              >
                <Bold className="w-4 h-4" />
                Negrito
              </Toggle>

              <Toggle
                pressed={fontStyle === 'italic'}
                onPressedChange={(pressed) => setFontStyle(pressed ? 'italic' : 'normal')}
                aria-label="Itálico"
                className="flex items-center gap-2"
              >
                <Italic className="w-4 h-4" />
                Itálico
              </Toggle>

              <Toggle
                pressed={textDecoration === 'underline'}
                onPressedChange={(pressed) => setTextDecoration(pressed ? 'underline' : 'none')}
                aria-label="Sublinhado"
                className="flex items-center gap-2"
              >
                <Underline className="w-4 h-4" />
                Sublinhado
              </Toggle>

              <Toggle
                pressed={textDecoration === 'line-through'}
                onPressedChange={(pressed) => setTextDecoration(pressed ? 'line-through' : 'none')}
                aria-label="Riscado"
                className="flex items-center gap-2"
              >
                <Strikethrough className="w-4 h-4" />
                Riscado
              </Toggle>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div className="border rounded-lg p-4 bg-muted/20 min-h-[80px]">
              {text ? (
                <div style={getPreviewStyle()}>
                  {text.split('\n').map((line, index) => (
                    <div key={index}>
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground italic">
                  Digite um texto para ver a pré-visualização
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tipo: {getElementTypeLabel(textLevel)} | Fonte: {fontFamily} | 
              {fontWeight === 'bold' && ' Negrito'} 
              {fontStyle === 'italic' && ' Itálico'}
              {textDecoration !== 'none' && ` ${textDecoration === 'underline' ? 'Sublinhado' : 'Riscado'}`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Resetar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleApply} className="bg-primary text-primary-foreground">
                Aplicar Alterações
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}