import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from './ui/drawer';
import { ScrollArea } from './ui/scroll-area';
// @ts-ignore
import { iconPaths } from './icon-paths.js';
import UIIconRenderer from './UIIconRenderer';

const categoryKeywords: { [key: string]: string[] } = {
  navigation: ['arrow', 'chevron', 'house', 'door', 'sign', 'map', 'geo', 'compass'],
  social: ['person', 'people', 'user', 'heart', 'star', 'envelope', 'telephone', 'chat', 'share', 'bell', 'emoji'],
  media: ['camera', 'image', 'video', 'music', 'volume', 'play', 'pause', 'skip', 'stop', 'record', 'speaker', 'mic', 'film'],
  actions: ['plus', 'dash', 'x', 'check', 'pencil', 'trash', 'copy', 'save', 'download', 'upload', 'arrow-clockwise', 'funnel', 'filter', 'search'],
  system: ['gear', 'shield', 'lock', 'unlock', 'eye', 'power', 'wifi', 'battery', 'bug', 'terminal', 'code'],
  status: ['info', 'question', 'exclamation', 'check-circle', 'x-circle', 'toggle', 'lightbulb'],
  business: ['cart', 'credit-card', 'currency', 'graph', 'pie-chart', 'activity', 'briefcase', 'tag', 'receipt', 'shop'],
  organization: ['calendar', 'clock', 'bookmark', 'flag', 'paperclip', 'file', 'folder', 'list', 'grid', 'layout'],
  shapes: ['square', 'circle', 'triangle', 'hexagon', 'diamond', 'star'],
  brands: ['facebook', 'twitter', 'instagram', 'linkedin', 'github', 'google', 'microsoft', 'apple', 'whatsapp', 'youtube'],
};

const getCategorizedIcons = () => {
  const categorized: { [key: string]: string[] } = {
    navigation: [], social: [], media: [], actions: [], system: [], status: [], business: [], organization: [], shapes: [], brands: [], other: [],
  };

  const iconNames = Object.keys(iconPaths);

  iconNames.forEach(iconName => {
    let category = 'other';
    for (const cat in categoryKeywords) {
      if (categoryKeywords[cat].some(keyword => iconName.includes(keyword))) {
        category = cat;
        break;
      }
    }
    categorized[category].push(iconName);
  });

  return categorized;
};

interface IconLibraryProps {
  onSelectIcon: (iconName: string) => void;
}

export function IconLibrary({ onSelectIcon }: IconLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const iconsPerPage = 40;

  const iconLibrary = useMemo(() => getCategorizedIcons(), []);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  const getFilteredIcons = () => {
    let allIcons: Array<{ name: string; category: string }> = [];

    Object.entries(iconLibrary).forEach(([category, icons]) => {
      icons.forEach(iconName => {
        allIcons.push({ name: iconName, category });
      });
    });

    if (selectedCategory !== 'all') {
      allIcons = allIcons.filter(icon => icon.category === selectedCategory);
    }

    if (searchTerm) {
      allIcons = allIcons.filter(icon =>
        icon.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const totalFilteredIcons = allIcons.length;
    const totalPages = Math.ceil(totalFilteredIcons / iconsPerPage);
    const startIndex = (currentPage - 1) * iconsPerPage;
    const endIndex = startIndex + iconsPerPage;
    const iconsToDisplay = allIcons.slice(startIndex, endIndex);

    return { iconsToDisplay, totalFilteredIcons, totalPages };
  };

  const handleSelectIcon = (iconName: string) => {
    onSelectIcon(iconName);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'navigation', name: 'Navegação' },
    { id: 'social', name: 'Social' },
    { id: 'media', name: 'Mídia' },
    { id: 'actions', name: 'Ações' },
    { id: 'system', name: 'Sistema' },
    { id: 'status', name: 'Status' },
    { id: 'business', name: 'Negócios' },
    { id: 'organization', name: 'Organização' },
    { id: 'shapes', name: 'Formas' },
    { id: 'brands', name: 'Marcas' },
    { id: 'other', name: 'Outros' },
  ];

  const { iconsToDisplay, totalFilteredIcons, totalPages } = getFilteredIcons();

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center p-2 border rounded-md"
        >
          Biblioteca de Ícones
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-1/2 p-4">
        <DrawerHeader>
          <DrawerTitle>Biblioteca de Ícones</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="icon-search">Buscar ícone</Label>
            <Input
              id="icon-search"
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Label>Categoria</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

         <ScrollArea className="w-full"style={{ height: '60vh' }}>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-8 gap-4 justify-items-center h-full">
              {iconsToDisplay.map((iconData) => (
                <Button
                  key={`${iconData.category}-${iconData.name}`}
                  variant="outline"
                  size="sm"
                  className="h-16 w-16 p-0 flex flex-col items-center justify-center text-center hover:bg-accent transition"
                  onClick={() => handleSelectIcon(iconData.name)}
                  title={iconData.name}
                >
                  <UIIconRenderer iconName={iconData.name} className="w-5 h-5" />
                  <span className="text-xs mt-1 truncate w-full px-1">{iconData.name}</span>
                </Button>
              ))}
            </div>

            {totalFilteredIcons === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ícone encontrado
              </div>
            )}
          </ScrollArea>

        </div>
        <DrawerFooter className="flex-row justify-center items-center">
            <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
            >
                Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
            >
                Próximo
            </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}