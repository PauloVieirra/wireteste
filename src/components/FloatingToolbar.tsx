
import React, { useState } from 'react';
import { Pencil, Box, Sparkles, CheckSquare, Accessibility, Eye, BotMessageSquare, Laptop, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface FloatingToolbarProps {
  style?: React.CSSProperties;
  activeMockup: string | null;
  onSelectMockup: (mockup: string | null) => void;
}

export const FloatingToolbar = ({ style, activeMockup, onSelectMockup }: FloatingToolbarProps) => {
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [is3DMenuOpen, setIs3DMenuOpen] = useState(false);

  if (activeMockup) {
    return (
      <div className="fixed z-10 bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col items-center p-1 space-y-1" style={{ ...style, width: '48px', marginTop: '300px' }}>
        <Button variant="ghost" size="icon" className="w-10 h-10 bg-blue-100" onClick={() => onSelectMockup(null)}>
          <Pencil className="w-5 h-5 text-blue-600" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed z-10 bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col items-center p-1 space-y-1" style={{ ...style, width: '48px', marginTop: '300px' }}>
        <Popover open={is3DMenuOpen} onOpenChange={setIs3DMenuOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10">
              <Box className="w-5 h-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 ml-2" side="right" align="start">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Visualização 3D</h4>
                <p className="text-sm text-muted-foreground">
                  Selecione um modelo para visualizar o wireframe.
                </p>
              </div>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start" onClick={() => { onSelectMockup('laptop'); setIs3DMenuOpen(false); }}>
                  <Laptop className="w-4 h-4 mr-2" />
                  Laptop Padrão
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => { onSelectMockup('macbook'); setIs3DMenuOpen(false); }}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  MacBook
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="w-10 h-10">
            <Pencil className="w-5 h-5" />
        </Button>

        <Popover open={isAiMenuOpen} onOpenChange={setIsAiMenuOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="w-10 h-10">
            <Sparkles className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 ml-2" side="right" align="start">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Análise de IA</h4>
              <p className="text-sm text-muted-foreground">
                Selecione um tipo de análise em tempo real.
              </p>
            </div>
            <div className="grid gap-2">
              <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <Accessibility className="w-4 h-4 mr-2" />
                Acessibilidade
              </a>
              <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <CheckSquare className="w-4 h-4 mr-2" />
                Usabilidade
              </a>
              <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <Eye className="w-4 h-4 mr-2" />
                Design Visual
              </a>
              <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <BotMessageSquare className="w-4 h-4 mr-2" />
                Análise de Escrita
              </a>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
