import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { supabase } from '../utils/supabase/client';

interface PublishedWireframe {
  id: string;
  project_id: string;
  user_id: string;
  svg: string;
  items: Array<{ id: string; nome: string; svg: string; atualizado_em: string }>;
  created_at: string;
  updated_at: string;
}

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportWireframe: (wireframeData: { name: string; svg: string }) => void; // Changed to directly pass svg
}

export function LibraryModal({ isOpen, onClose, onImportWireframe }: LibraryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedWireframes, setPublishedWireframes] = useState<PublishedWireframe[]>([]);
  const [selectedItems, setSelectedItems] = useState<Array<{ projectId: string; itemId: string; name: string; svg: string; }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWireframes();
    }
  }, [isOpen, searchTerm]);

  const fetchWireframes = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('kv_story').select('id, project_id, user_id, svg, items, created_at, updated_at').limit(10);

      if (searchTerm) {
        // Search on project_id as 'name' column does not exist
        query = query.ilike('project_id', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      setPublishedWireframes(data || []);
    } catch (err: any) {
      console.error('Error fetching published wireframes:', err);
      setError(err.message || 'Failed to fetch wireframes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (projectId: string, itemId: string, name: string, svg: string, isChecked: boolean) => {
    setSelectedItems(prevSelectedItems => {
      if (isChecked) {
        return [...prevSelectedItems, { projectId, itemId, name, svg }];
      } else {
        return prevSelectedItems.filter(item => !(item.projectId === projectId && item.itemId === itemId));
      }
    });
  };

  const handleImportClick = () => {
    if (selectedItems.length > 0) {
      selectedItems.forEach(item => {
        onImportWireframe({
          name: `Imported: ${item.name}`,
          svg: item.svg
        });
      });
      onClose();
      setSelectedItems([]); // Clear selection after import
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Biblioteca de Wireframes</DialogTitle>
          <DialogDescription>
            Pesquise e importe wireframes publicados por outros usuários.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Pesquisar por nome da tela..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          {loading && <p>Carregando...</p>}
          {error && <p className="text-red-500">Erro: {error}</p>}
          {!loading && publishedWireframes.length === 0 && !error && (
            <p>Nenhum wireframe encontrado.</p>
          )}
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {publishedWireframes.map(pubWireframe => (
              <div
                key={pubWireframe.id}
                className="border p-2 rounded-md"
              >
                <h3 className="font-semibold">Projeto: {pubWireframe.project_id}</h3>
                <p className="text-sm text-muted-foreground">Publicado por: {pubWireframe.user_id}</p>
                {pubWireframe.items && pubWireframe.items.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Telas:</p>
                    {pubWireframe.items.map(item => {
                      const isSelected = selectedItems.some(sItem => sItem.projectId === pubWireframe.id && sItem.itemId === item.id);
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 text-xs p-1 rounded-sm ${isSelected ? 'bg-blue-100' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(pubWireframe.id, item.id, item.nome, item.svg, e.target.checked)}
                            className="form-checkbox"
                          />
                          <span>{item.nome}</span>
                          {/* Render a small SVG thumbnail if possible */}
                          {item.svg && (
                            <div
                              dangerouslySetInnerHTML={{ __html: item.svg }}
                              style={{ width: '50px', height: '30px', border: '1px solid #eee', overflow: 'hidden' }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleImportClick} disabled={selectedItems.length === 0}>
            Importar ({selectedItems.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
