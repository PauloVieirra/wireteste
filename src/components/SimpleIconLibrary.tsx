import React, { Suspense, useMemo } from 'react';
import { Button } from './ui/button';
import { iconIndex } from './icon-index'; // Importa o índice completo dos seus ícones
import { Star } from 'lucide-react'; // Importa um ícone de fallback, se necessário

interface SimpleIconLibraryProps {
  onSelectIcon?: (iconName: string) => void;
}

export function SimpleIconLibrary({ onSelectIcon }: SimpleIconLibraryProps) {
  // Gera a lista de ícones a partir do iconIndex
  const icons = useMemo(() => {
    return Object.keys(iconIndex).map(name => ({
      name,
      component: iconIndex[name]
    }));
  }, []);

  const handleIconDragStart = (e: React.DragEvent, iconName: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'icon',
      iconName,
      iconComponent: iconName // Garante que o nome do componente seja o mesmo que o nome do ícone
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleIconClick = (iconName: string) => {
    if (onSelectIcon) {
      onSelectIcon(iconName);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto">
      {icons.map(({ name, component: IconComponent }) => (
        <Button
          key={name}
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0"
          draggable
          onDragStart={(e) => handleIconDragStart(e, name)}
          onClick={() => handleIconClick(name)}
          title={name}
        >
          <Suspense fallback={<div>...</div>}>
            {IconComponent ? (
              <IconComponent className="w-4 h-4" />
            ) : (
              <Star className="w-4 h-4" /> // Fallback visual para ícones não encontrados
            )}
          </Suspense>
        </Button>
      ))}
    </div>
  );
}
