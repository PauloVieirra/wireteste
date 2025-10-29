import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Edit3, Play, BarChart3, Monitor, Tablet, Smartphone, MoreVertical, Share2, Trash2, FileText, Send } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from './ToastProvider';
import { Badge } from './ui/badge';
import type { DisplayItem, UsabilityTest } from '../types';
import { TestSelectionModal } from './TestSelectionModal';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  projectsCreated: number;
  reportsGenerated: number;
}

interface ProjectListProps {
  items: DisplayItem[];
  user: User;
  onOpenNewProjectModal: () => void;
  onEditProject: (project: any) => void;
  onEditSurvey: (survey: any) => void;
  onSendSurvey: (survey: any) => void;
  onCreateTest: (project: any) => void;
  onConfigureTest: (project: any) => void;
  onViewDashboard: (item: DisplayItem) => void;
  onStartUserTest: (testId: string, testType: UsabilityTest['type'], isDemo?: boolean) => void;
  onDeleteProject?: (itemId: string, itemType: DisplayItem['type']) => void;
}

const typeDisplay: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  wireframe: { label: 'Telas', variant: 'secondary' },
  mapa_calor: { label: 'Mapa de Calor', variant: 'default' },
  survey: { label: 'Pesquisa', variant: 'outline' },
};

export function ProjectList({ 
  items, 
  user,
  onOpenNewProjectModal,
  onEditProject, 
  onEditSurvey,
  onSendSurvey,
  onCreateTest, 
  onConfigureTest, 
  onViewDashboard,
  onStartUserTest,
  onDeleteProject,
}: ProjectListProps) {
  const { showToast } = useToast();
  const [isTestSelectionModalOpen, setIsTestSelectionModalOpen] = useState(false);
  const [selectedItemForTest, setSelectedItemForTest] = useState<DisplayItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        if (filter === 'all') return true;
        return item.type === filter;
      })
      .filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [items, filter, searchQuery]);

  const handleShare = (tests: UsabilityTest[]) => {
    if (tests.length === 0) {
      showToast('Nenhum teste associado a este projeto para compartilhar.', 'error');
      return;
    }
    const shareUrl = `${window.location.origin}/?view=user-test&testId=${tests[0].id}`;
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

  const handleTestButtonClick = (item: DisplayItem) => {
    if (item.tests.length === 1) {
      onStartUserTest(item.tests[0].id, item.tests[0].type, true);
    } else {
      setSelectedItemForTest(item);
      setIsTestSelectionModalOpen(true);
    }
  };

  if (items.length === 0 && filteredItems.length === 0) {
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
          <Input 
            placeholder="Buscar projetos..."
            className="w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="wireframe">Telas</SelectItem>
              <SelectItem value="survey">Pesquisas</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onOpenNewProjectModal}>
            <Plus className="w-4 h-4 mr-2" />
            Novo projeto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
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
                {item.type === 'survey' && <div>Perguntas: {item.question_count}</div>}
               </div>
                 <Button variant="outline" onClick={() => handleShare(item.tests)} disabled={item.tests.length === 0}>
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
                    <Button variant="default" size="sm" onClick={() => onConfigureTest(item.original)}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar testes
                    </Button>

                  </>
                )}
                {item.type === 'survey' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { /* Implementar visualização de resultados da pesquisa */ }}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Ver Resultados
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onEditSurvey(item.original)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar Pesquisa
                    </Button>
                    <Button variant="default" size="sm" onClick={() => onSendSurvey(item.original)}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Pesquisa
                    </Button>
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
      {filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center text-muted-foreground mt-12">
          <p>Nenhum projeto encontrado com os filtros atuais.</p>
        </div>
      )}
      {selectedItemForTest && (
        <TestSelectionModal
          isOpen={isTestSelectionModalOpen}
          onClose={() => setIsTestSelectionModalOpen(false)}
          tests={selectedItemForTest.tests}
          onSelectTest={(testId, testType) => {
            onStartUserTest(testId, testType, true);
            setIsTestSelectionModalOpen(false);
          }}
        />
      )}
    </div>
  );
}