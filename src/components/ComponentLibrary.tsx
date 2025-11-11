import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer';
import { ScrollArea } from './ui/scroll-area';

import { supabase } from '../utils/supabase/client';
interface ComponentLibraryProps {
    components?: any[];
    onAddComponent?: (component: any) => void;
}

export function ComponentLibrary({ components, onAddComponent }: ComponentLibraryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [componentsList, setComponentsList] = useState<any[]>(components || []);
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });

    const filters = [
        { id: 'all', name: 'Todos' },
        { id: 'mobile', name: 'Mobile' },
        { id: 'tablet', name: 'Tablet' },
        { id: 'web', name: 'Web' },
    ];

    const filteredComponents = componentsList.filter(component =>
        (component.nome || component.name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedFilter === 'all' || !component.categoria || component.categoria === selectedFilter)
    );

    const handleDragStart = (e: React.DragEvent, component: any) => {
        e.dataTransfer.setData('application/json', JSON.stringify(component));
    };

    const fetchComponents = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from('biblioteca_componentes').select('*').limit(200);
            if (searchTerm) {
                query = query.ilike('nome', `%${searchTerm}%`);
            }
            if (selectedFilter && selectedFilter !== 'all') {
                query = query.eq('categoria', selectedFilter);
            }
            const { data, error } = await query;
            if (error) {
                console.error('Erro ao buscar componentes:', error);
                setComponentsList([]);
            } else {
                setComponentsList(data || []);
            }
        } catch (err) {
            console.error('Erro na requisição de componentes:', err);
            setComponentsList([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        // initial fetch when opening
        fetchComponents();
    }, [isOpen]);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, component: any) => {
        if (component.imagem_url) {
            const rect = e.currentTarget.getBoundingClientRect();
            const PREVIEW_WIDTH = 200;
            const GAP = 10;
            setPreviewPosition({
                top: rect.top,
                left: rect.left - PREVIEW_WIDTH - GAP,
            });
            setPreviewImage(component.imagem_url);
        }
    };

    const handleMouseLeave = () => {
        setPreviewImage(null);
    };

    return (
        <Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
            {previewImage && (
                <div
                    className="fixed z-50 p-2 bg-white border rounded-md shadow-lg"
                    style={{
                        top: previewPosition.top,
                        left: previewPosition.left,
                        width: 200,
                    }}
                >
                    <img src={previewImage} alt="Preview" className="w-full h-auto" />
                </div>
            )}
            <DrawerTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full flex items-center justify-center p-2 border rounded-md"
                >
                    Biblioteca de Componentes
                </Button>
            </DrawerTrigger>
            <DrawerContent className="w-1/2 p-4">
                <DrawerHeader>
                    <DrawerTitle>Biblioteca de Componentes</DrawerTitle>
                </DrawerHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="component-search">Buscar componente</Label>
                        <div className="flex gap-2">
                            <Input
                                id="component-search"
                                placeholder="Digite para buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Button onClick={() => fetchComponents()}>Buscar</Button>
                        </div>
                    </div>

                    <div>
                        <Label>Filtros</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {filters.map((filter) => (
                                <Button
                                    key={filter.id}
                                    variant={selectedFilter === filter.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedFilter(filter.id)}
                                >
                                    {filter.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <ScrollArea className="w-full" style={{ height: '60vh' }}>
                        {filteredComponents.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {filteredComponents.map((component) => (
                                    <div
                                        key={component.id}
                                        className="border rounded-md p-2 cursor-pointer"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, component)}
                                        onMouseEnter={(e) => handleMouseEnter(e, component)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <div className="h-28 bg-gray-100 rounded-md flex items-center justify-center mb-2">
                                            {component.imagem_url ? (
                                                <img src={component.imagem_url} alt={component.nome || component.name} className="max-h-full max-w-full" />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Imagem</span>
                                            )}
                                        </div>
                                        <div className="font-medium truncate">{component.nome || component.name}</div>
                                        <div className="text-sm text-muted-foreground">{component.categoria}</div>
                                        <div className="mt-2 flex gap-2">
                                            {onAddComponent ? (
                                                <Button size="sm" onClick={() => onAddComponent!(component)}>Inserir</Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum componente para exibir ainda.
                            </div>
                        )}
                    </ScrollArea>

                </div>
            </DrawerContent>
        </Drawer>
    );
}