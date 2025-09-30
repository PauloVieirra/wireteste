import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Edit3, Play, BarChart3, Monitor, Tablet, Smartphone, MoreVertical, Share2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from './ToastProvider';
import { Badge } from './ui/badge'; // Import Badge
import type { DisplayItem } from '../App'; // Import DisplayItem type

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  projectsCreated: number;
  reportsGenerated: number;
}

interface ProjectListProps {
  items: DisplayItem[]; // Use the unified list
  user: User;
  onOpenNewProjectModal: () => void;
  onEditProject: (project: any) => void; // Use any for now
  onCreateTest: (project: any) => void; // Re-adicionado
  onConfigureTest: (project: any) => void; // Re-adicionado
  onViewDashboard: (item: DisplayItem) => void;
  onStartUserTest: (testId: string, testType: DisplayItem['type'], isDemo?: boolean) => void;
  onDeleteProject?: (itemId: string, itemType: DisplayItem['type']) => void;
  // onManageTest: (project: any) => void; // Removido
}

const typeDisplay: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  wireframe: { label: 'Telas', variant: 'secondary' },
  mapa_calor: { label: 'Mapa de Calor', variant: 'default' },
};

export function ProjectList({ 
  items, 
  user,
  onOpenNewProjectModal,
  onEditProject, 
  onCreateTest, // Re-adicionado
  onConfigureTest, // Re-adicionado
  onViewDashboard,
  onStartUserTest,
  onDeleteProject,
  // onManageTest // Removido
}: ProjectListProps) {
  const { showToast } = useToast();

  const handleShare = (testId: string | undefined) => {
    if (!testId) {
      showToast('Nenhum teste associado a este projeto para compartilhar.', 'error');
      return;
    }
    const shareUrl = `${window.location.origin}/?view=user-test&testId=${testId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Link para o teste copiado para a área de transferência!', 'success');
    }).catch(() => {
      showToast('Erro ao copiar o link do teste', 'error');
    });
  };

  const handleDelete = (item: DisplayItem) => {
    if (onDeleteProject) {
      onDeleteProject(item.id, item.type);
      showToast('Projeto excluído com sucesso!', 'success');
    }
  };

  const getResolutionIcon = (res?: string) => {
    switch (res) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      default: return null;
    }
  };

  const getResolutionDimensions = (res?: string) => {
    switch (res) {
      case 'mobile': return '375×812';
      case 'tablet': return '768×1024';
      case 'desktop': return '1440×900';
      default: return null;
    }
  };



  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Plus className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="mb-2">Nenhum projeto encontrado</h2>
          <p className="text-muted-foreground mb-6">
            Crie seu primeiro projeto para começar a testar a usabilidade.
          </p>
          <Button onClick={onOpenNewProjectModal}>
            <Plus className="w-4 h-4 mr-2" />
            Iniciar novo projeto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Meus Projetos</h2>
          <p className="text-muted-foreground">
            Gerencie seus wireframes e testes de usabilidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onOpenNewProjectModal}>
            <Plus className="w-4 h-4 mr-2" />
            Novo projeto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge variant={typeDisplay[item.type]?.variant || 'default'} className="mb-2">
                    {typeDisplay[item.type]?.label || 'Projeto'}
                  </Badge>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  {item.type === 'wireframe' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      {getResolutionIcon(item.resolution)}
                      <span>{getResolutionDimensions(item.resolution)}</span>
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar "{item.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-sm text-muted-foreground mb-4"  style={{display:'flex',gap:"8px",flexDirection:"row", width:"100%",justifyContent:"space-between"}}>
                <div> 
                <div>Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}</div>
                {item.type === 'wireframe' && <div>Wireframes: {item.wireframe_count}</div>}
                
               </div>
                 <Button variant="outline"   onClick={() => handleShare(item.testId)}  disabled={!item.testId}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar
                 </Button>
              </div>
              <div className="flex flex-col gap-2">
                {item.type === 'wireframe' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onViewDashboard(item)} className="w-full justify-start" disabled={!item.hasTestData}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEditProject(item.original)} className="w-full justify-start">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar telas
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onCreateTest(item.original)} className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Criar Teste de Usabilidade
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onConfigureTest(item.original)} className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Configurar Testes
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => onStartUserTest(item.testId, 'mapa_calor', true)} className="w-full justify-start" disabled={!item.testId}>
                        <Play className="w-4 h-4 mr-2" />
                        Testar
                      </Button>
                     
                    </div>
                  </>
                )}
                {item.type === 'mapa_calor' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onViewDashboard(item)} className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Ver resultados
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onStartUserTest(item.id, item.type)} className="w-full justify-start">
                      <Play className="w-4 h-4 mr-2" />
                      Testar Mapa de Calor
                    </Button>
                  </>
                )}

              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
