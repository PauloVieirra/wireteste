import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

interface CreateWireframeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, resolution: 'mobile' | 'tablet' | 'desktop', description: string) => void;
}

export function CreateWireframeDialog({ isOpen, onClose, onCreateProject }: CreateWireframeDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [resolution, setResolution] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const handleCreate = () => {
    if (name.trim()) {
      onCreateProject(name, resolution, description);
      setName(''); // Reset name after creation
      setDescription(''); // Reset description
      onClose(); // Close dialog after creation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto de Wireframe</DialogTitle>
          <DialogDescription>
            Configure um novo projeto de wireframe para começar a criar e testar interfaces.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div style={{display:'flex',gap:"8px", flexDirection:"column"}}>
            
             <Label htmlFor="project-name">Nome do projeto</Label>
            
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: App Mobile E-commerce"
            />
          </div>
          <div style={{display:'flex',gap:"8px", flexDirection:"column"}}>
            <Label htmlFor="project-description">Descrição do projeto</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo principal deste projeto."
            />
          </div>
          <div style={{display:'flex',gap:"8px", flexDirection:"column"}}>
            <Label htmlFor="resolution">Resolução da tela</Label>
            <Select value={resolution} onValueChange={(value: 'mobile' | 'tablet' | 'desktop') => setResolution(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile (375×812)
                  </div>
                </SelectItem>
                <SelectItem value="tablet">
                  <div className="flex items-center gap-2">
                    <Tablet className="w-4 h-4" />
                    Tablet (768×1024)
                  </div>
                </SelectItem>
                <SelectItem value="desktop">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Desktop (1440×900)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreate} className="flex-1">
              Criar projeto
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
