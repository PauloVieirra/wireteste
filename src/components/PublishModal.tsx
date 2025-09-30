import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

interface Wireframe {
  id: string;
  name: string;
  elements: any[]; // Simplified for now
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  wireframes: Wireframe[];
  onPublish: (selectedWireframeIds: string[]) => void;
}

export function PublishModal({ isOpen, onClose, wireframes, onPublish }: PublishModalProps) {
  const [selectedWireframeIds, setSelectedWireframeIds] = useState<string[]>([]);

  const handleCheckboxChange = (wireframeId: string, isChecked: boolean) => {
    setSelectedWireframeIds(prev =>
      isChecked ? [...prev, wireframeId] : prev.filter(id => id !== wireframeId)
    );
  };

  const handlePublishClick = () => {
    onPublish(selectedWireframeIds);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Publicar Telas</DialogTitle>
          <DialogDescription>
            Selecione as telas que deseja publicar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {wireframes.map(wireframe => (
            <div key={wireframe.id} className="flex items-center space-x-2">
              <Checkbox
                id={wireframe.id}
                checked={selectedWireframeIds.includes(wireframe.id)}
                onCheckedChange={(checked) => handleCheckboxChange(wireframe.id, checked as boolean)}
              />
              <label
                htmlFor={wireframe.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {wireframe.name}
              </label>
              {/* Placeholder for thumbnail */}
              <div className="w-24 h-16 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                Thumbnail
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handlePublishClick} disabled={selectedWireframeIds.length === 0}>
            Confirmar Publicação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
