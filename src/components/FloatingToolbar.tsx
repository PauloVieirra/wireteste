
import React, { useState } from 'react';
import { Pencil, Box, Sparkles, CheckSquare, Accessibility, Eye, BotMessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export const FloatingToolbar = ({ style }: { style: React.CSSProperties }) => {
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);

  return (
    <div className="fixed z-10 bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col items-center p-1 space-y-1" style={{ ...style, width: '48px', marginTop: '300px' }}>
      <Button variant="ghost" size="icon" className="w-10 h-10">
        <Pencil className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="icon" className="w-10 h-10">
        <Box className="w-5 h-5" />
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
