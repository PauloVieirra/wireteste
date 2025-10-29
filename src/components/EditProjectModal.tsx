import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import type { Project } from '../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
}

export function EditProjectModal({ isOpen, onClose, project, onUpdateProject }: EditProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
    }
  }, [project]);

  const handleUpdate = () => {
    if (project && name.trim()) {
      const updates: Partial<Project> = {
        name,
        description,
      };
      onUpdateProject(project.id, updates);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do seu projeto.
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

          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdate} className="flex-1">
              Salvar Alterações
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
