import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ColorPicker } from './ColorPicker';
import { FontLevelPicker } from './FontLevelPicker';
import { TextColorPicker } from './TextColorPicker';
import { TextAlignPicker } from './TextAlignPicker';
import { BorderWidthPicker } from './BorderWidthPicker';
import { BorderColorPicker } from './BorderColorPicker';
import { DimensionEditor } from './DimensionEditor';
import { GridSettings } from './GridSettings';
import { IconLibrary } from './IconLibrary';
import { ElementTree } from './ElementTree';
import { useToast } from './ToastProvider';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizable';
import { TextEditor } from './TextEditor';
import { BorderRadiusPicker } from './BorderRadiusPicker';
import { PublishModal } from './PublishModal';
import { LibraryModal } from './LibraryModal';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../utils/supabase/client';
import { saveOrUpdateProject, getProjectById } from '../utils/supabase/supabaseClient';
import { iconIndex } from './icon-index';
import Konva from 'konva'; // Keep Konva import
import { exportStageSVG } from 'react-konva-to-svg';
import { WireframeCanvas } from './WireframeCanvas'; // Keep WireframeCanvas import
import GridOverlay from './GridOverlay';
import { Signal } from './Signal';

const imageplaceholder = "https://images.unsplash.com/photo-1714578187196-29775454aa39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFjZWhvbGRlciUyMGltYWdlfGVufDF8fHx8MTc1NzgwOTUzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const videoplaceholder = "https://images.unsplash.com/photo-1642726197561-ef7224c054a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMHBsYXllciUyMHRodW1ibmFpbHxlbnwxfHx8fDE3NTc3NjA2Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

import {
  Square,
  Circle,
  Minus,
  Type,
  Image,
  Video,
  MousePointer,
  Plus,
  ZoomIn,
  ZoomOut,
  Save,
  Layers,
  Palette,
  ChevronUp,
  ChevronDown,
  Trash2,
  Move3D,
  ArrowRight,
  Copy,
  Clipboard,
  Edit3,
  Star // Added Star for default icon rendering
} from 'lucide-react';

interface WireframeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  backgroundColor?: string;
  textLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  zIndex?: number;
  borderWidth?: number;
  borderColor?: string;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  parentId?: string;
  name?: string;
  opacity?: number; // Adicionado para controlar a transparência da imagem
  // Advanced text properties
  fontWeight?: 'normal' | 'bold';
  fontFamily?: 'inter' | 'roboto' | 'arial' | 'helvetica' | 'times' | 'georgia' | 'monospace';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
}

interface Wireframe {
  id: string;
  name: string;
  elements: WireframeElement[];
}

interface GridConfig {
  enabled: boolean;
  columns: number;
  gap: number;
  margin: number;
  color: 'red';
  opacity: number;
}

interface Project {
  id: string;
  name: string;
  resolution: 'mobile' | 'tablet' | 'desktop';
  wireframes: Wireframe[];
  createdAt: string;
  gridConfig?: GridConfig;
}

interface WireframeEditorProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  // unsavedWarning: boolean; // Removido: A lógica de status de salvamento será interna
}

const getFontSize = (element: WireframeElement, resolution: 'mobile' | 'tablet' | 'desktop') => {
  const fontSizes = {
    desktop: {
      h1: 40,  // 2.5rem
      h2: 32,  // 2rem
      h3: 28,  // 1.75rem
      h4: 24,  // 1.5rem
      h5: 20,  // 1.25rem
      h6: 16,  // 1rem
      p: 16    // 1rem
    },
    tablet: {
      h1: 32,  // 2rem
      h2: 28,  // 1.75rem
      h3: 24,  // 1.5rem
      h4: 20,  // 1.25rem
      h5: 18,  // 1.125rem
      h6: 16,  // 1rem
      p: 15    // 0.95rem
    },
    mobile: {
      h1: 28,  // 1.75rem
      h2: 24,  // 1.5rem
      h3: 20,  // 1.25rem
      h4: 18,  // 1.125rem
      h5: 16,  // 1rem
      h6: 14,  // 0.875rem
      p: 14    // 0.875rem
    }
  };

  const level = element.textLevel || 'p';
  return fontSizes[resolution][level];
};

const getFontFamilyCSS = (font: string) => {
  switch (font) {
    case 'inter': return "'Inter', system-ui, sans-serif";
    case 'roboto': return "'Roboto', system-ui, sans-serif";
    case 'arial': return 'Arial, sans-serif';
    case 'helvetica': return "'Helvetica Neue', Helvetica, sans-serif";
    case 'times': return "'Times New Roman', Times, serif";
    case 'georgia': return 'Georgia, serif';
    case 'monospace': return "'Fira Code', 'Consolas', monospace";
    default: return "'Inter', system-ui, sans-serif";
  }
};

// Helper function to get minimum size based on element type
const getElementMinimumSize = (elementType: string) => {
  switch (elementType) {
    case 'icon': return 14; // Minimum 14px for icons as requested
    case 'line': return 2;  // Very small minimum for lines
    default: return 5;      // General minimum for other elements
  }
};

export function WireframeEditor({ project, onUpdateProject }: WireframeEditorProps) {
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeWireframe, setActiveWireframe] = useState<string>('none');
  const [zoom, setZoom] = useState(1);
  const [sidebarTab, setSidebarTab] = useState<'components' | 'properties'>('components');
  const [gridConfig, setGridConfig] = useState<GridConfig>(
    project.gridConfig || {
      enabled: false,
      columns: 12,
      gap: 16,
      margin: 24,
      color: 'red',
      opacity: 0.1
    }
  );
  const [draggedTool, setDraggedTool] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [isAddWireframeOpen, setIsAddWireframeOpen] = useState(false);
  const [newWireframeName, setNewWireframeName] = useState('');
  const [copiedElement, setCopiedElement] = useState<WireframeElement | null>(null);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'Atualizado' | 'Atualizar' | 'Salvando...' | 'Verificando...' | 'Erro ao salvar'>('Atualizado');
  // const [warningShown, setWarningShown] = useState(false); // Removido

  const stageRef = useRef<Konva.Stage>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const isPointerInsideRef = useRef(false);
  const { showToast } = useToast();

  const updateAndSaveProject = (updatedProject: Project) => {
    onUpdateProject(updatedProject);
    saveProjectLocally(updatedProject);
  };

  // Ref para controlar se há alterações não salvas no localStorage
  const hasLocalChangesRef = useRef(false);
  const unsavedChangesToastShownRef = useRef(false); // Novo ref para controlar o toast de alterações não salvas no WireframeEditor

  // Função para salvar o projeto localmente
  const saveProjectLocally = useCallback((currentProject: Project) => {
    localStorage.setItem(`wireframe_project_${currentProject.id}`, JSON.stringify(currentProject));
    hasLocalChangesRef.current = true; // Indica que há alterações salvas localmente
    setSaveStatus('Atualizar'); // O status agora reflete alterações locais pendentes de upload
  }, []);

  // Carregar projeto do localStorage e verificar status ao montar
  useEffect(() => {
    const projectId = project.id;
    const localProjectJson = localStorage.getItem(`wireframe_project_${projectId}`);

    if (localProjectJson) {
      try {
        const localProject: Project = JSON.parse(localProjectJson);
        // Compara a versão local com a versão vinda do banco de dados via props
        if (JSON.stringify(localProject.wireframes) !== JSON.stringify(project.wireframes) || 
            JSON.stringify(localProject.gridConfig) !== JSON.stringify(project.gridConfig)) {
          // Se a versão local for diferente da versão do banco de dados (inicialmente carregada)
          // e o local timestamp for mais recente (opcional, pode ser inferido pela existência)
          setSaveStatus('Atualizar'); // Indica que há uma versão mais recente localmente
          hasLocalChangesRef.current = true;
          // Evita exibir o toast repetidamente se já foi mostrado nesta sessão de edição
          if (!unsavedChangesToastShownRef.current) {
            showToast("Encontramos alterações não salvas localmente. Clique em 'Atualizar' para sincronizar.", "info");
            unsavedChangesToastShownRef.current = true;
          }
        } else {
          setSaveStatus('Atualizado');
          hasLocalChangesRef.current = false;
          unsavedChangesToastShownRef.current = false; // Resetar se o projeto estiver atualizado
        }
      } catch (e) {
        console.error("Erro ao carregar projeto do localStorage:", e);
        localStorage.removeItem(`wireframe_project_${projectId}`); // Limpa dados corrompidos
      }
    } else {
      setSaveStatus('Atualizado');
      hasLocalChangesRef.current = false;
      unsavedChangesToastShownRef.current = false; // Resetar se não há nada no localstorage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]); // Executa apenas na montagem inicial e quando o ID do projeto muda

  

  // Adiciona/remove o listener para o evento beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Permitir a saída, mas garantir que as alterações locais sejam consideradas salvas
      // O usuário pode sair sem salvar no DB, mas não queremos mais bloquear a navegação
      if (hasLocalChangesRef.current) {
        // O ideal seria um prompt nativo do navegador, mas o usuário pediu para não bloquear
        // Portanto, apenas registra que havia alterações não salvas no DB
        // As alterações locais *já foram salvas* no localStorage
        return undefined; // Não retorna uma string para evitar o prompt
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Dependências vazias, pois hasLocalChangesRef é uma ref
  
  const handleSaveProject = async () => {
    setSaveStatus('Salvando...');
    try {
      await saveOrUpdateProject(project);
      onUpdateProject(project); // Isso também chamará saveProjectLocally
      showToast('Projeto salvo com sucesso!', 'success');
      setSaveStatus('Atualizado'); // Após salvar no DB, o status é atualizado
      hasLocalChangesRef.current = false; // Não há mais alterações pendentes no DB
    } catch (error) {
      if (error instanceof Error) {
        showToast(`Erro ao salvar: ${error.message}`, 'error');
      }
      setSaveStatus('Erro ao salvar');
      // Manter hasLocalChangesRef.current como true se o salvamento no DB falhar
    }
  };

  const getCanvasDimensions = () => {
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1920, height: 1080 };
      default: return { width: 1920, height: 1080 };
    }
  };

  const currentWireframe = activeWireframe !== 'none' ? project.wireframes.find(w => w.id === activeWireframe) : null;
  const canvasDimensions = getCanvasDimensions();

  const triggerUnsyncedState = () => {
    // setSaveStatus('Atualizar'); // Não é mais necessário, pois saveProjectLocally já faz isso
  };

  const updateElementProperties = useCallback((elementId: string, props: Partial<WireframeElement>) => {
    triggerUnsyncedState();
    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w => 
        activeWireframe !== 'none' && w.id === activeWireframe 
          ? { 
              ...w, 
              elements: w.elements.map(el => {
                if (el.id === elementId) {
                  const updatedElement = { ...el, ...props };
                  
                  if (el.type === 'icon') {
                    if (props.width !== undefined) {
                      updatedElement.width = Math.max(14, props.width);
                    }
                    if (props.height !== undefined) {
                      updatedElement.height = Math.max(14, props.height);
                    }
                  }
                  
                  return updatedElement;
                }
                return el;
              }) 
            }
          : w
      )
    };
    updateAndSaveProject(updatedProject);
  }, [project, activeWireframe, onUpdateProject, saveProjectLocally]);

  const updateElementProperty = useCallback((elementId: string, property: string, value: any) => {
    updateElementProperties(elementId, { [property]: value });
  }, [updateElementProperties]);

  const handleApplyTextChanges = (changes: Partial<WireframeElement>) => {
    if (!selectedElement) return;
    triggerUnsyncedState();
    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w =>
        w.id === activeWireframe
          ? {
              ...w,
              elements: w.elements.map(el =>
                el.id === selectedElement
                  ? { ...el, ...changes }
                  : el
              )
            }
          : w
      )
    };
    updateAndSaveProject(updatedProject);
  };

  useEffect(() => {
    if (project.wireframes.length === 0) {
      triggerUnsyncedState();
      const firstWireframe: Wireframe = {
        id: Date.now().toString(),
        name: 'Tela 1',
        elements: []
      };

      const updatedProject = {
        ...project,
        wireframes: [firstWireframe]
      };
      
      updateAndSaveProject(updatedProject);
      setActiveWireframe(firstWireframe.id);
    } else if (activeWireframe === 'none' && project.wireframes.length > 0) {
      setActiveWireframe(project.wireframes[0].id);
    }
  }, [project, onUpdateProject, activeWireframe]);

  useEffect(() => {
    if (selectedElement) {
      setSidebarTab('properties');
    }
  }, [selectedElement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && isPointerInsideRef.current) {
        const key = e.key;
        if (key === '+' || key === '=' || key === '-' || key === '0') {
          e.preventDefault();
          e.stopPropagation();

          if (key === '+' || key === '=') {
            setZoom(z => Math.min(3, z + 0.1));
          } else if (key === '-') {
            setZoom(z => Math.max(0.2, z - 0.1));
          } else if (key === '0') {
            setZoom(1);
          }
          return;
        }
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (isMod && e.key === 'c' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        copyElement();
        return;
      }

      if (isMod && e.key === 'v' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        pasteElement();
        return;
      }

      if (selectedElement && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        handleDeleteSelectedElement();
        return;
      }

      if (selectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;

        switch (e.key) {
          case 'ArrowUp':
            moveElementWithKeyboard('up', step);
            break;
          case 'ArrowDown':
            moveElementWithKeyboard('down', step);
            break;
          case 'ArrowLeft':
            moveElementWithKeyboard('left', step);
            break;
          case 'ArrowRight':
            moveElementWithKeyboard('right', step);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [selectedElement, copiedElement, currentWireframe, activeWireframe, canvasDimensions, setZoom]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (isPointerInsideRef.current && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();

        const step = -e.deltaY * 0.0015;
        setZoom(prev => {
          let next = prev + step;
          next = Math.max(0.2, Math.min(3, next));
          return next;
        });
      }
    };

    const options = { passive: false, capture: true };
    window.addEventListener('wheel', onWheel, options as AddEventListenerOptions);

    return () => {
      window.removeEventListener('wheel', onWheel, options as AddEventListenerOptions);
    };
  }, [setZoom]);

  const handleToolDragStart = (e: React.DragEvent, toolType: string) => {
    e.stopPropagation();
    setDraggedTool(toolType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', toolType);
    e.dataTransfer.setData('application/x-wireframe-tool', toolType);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    const hasIcon = e.dataTransfer.types.includes('application/json');
    const hasTool = e.dataTransfer.types.includes('application/x-wireframe-tool') || 
                    e.dataTransfer.types.includes('text/plain');
    
    if (draggedTool || hasIcon || hasTool) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOverCanvas(true);
    }
  };

  const handleCanvasDragLeave = () => {
    setIsDragOverCanvas(false);
  };

  const handleDragEnd = () => {
    setDraggedTool(null);
    setIsDragOverCanvas(false);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    triggerUnsyncedState();
    setIsDragOverCanvas(false);
    
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const stageContainer = stage.container();
    const stageRect = stageContainer.getBoundingClientRect();

    const x = (e.clientX - stageRect.left) / zoom;
    const y = (e.clientY - stageRect.top) / zoom;
    
    let iconData = null;
    try {
      const transferData = e.dataTransfer.getData('application/json');
      if (transferData) {
        iconData = JSON.parse(transferData);
      }
    } catch (error) {
      // Not an icon
    }
    
    if (iconData && iconData.type === 'icon') {
      const minSize = { width: Math.max(24, 40), height: Math.max(24, 40) };
      
      const newElement: WireframeElement = {
        id: Date.now().toString(),
        type: 'icon',
        x: Math.max(0, Math.min(canvasDimensions.width - minSize.width, x - minSize.width / 2)),
        y: Math.max(0, Math.min(canvasDimensions.height - minSize.height, y - minSize.height / 2)),
        width: minSize.width,
        height: minSize.height,
        backgroundColor: 'transparent',
        textColor: 'var(--foreground)',
        zIndex: 0,
        borderWidth: 0,
        iconName: iconData.iconName,
        iconComponent: iconData.iconComponent,
      };

      const updatedProject = {
        ...project,
        wireframes: project.wireframes.map(w => 
          w.id === activeWireframe 
            ? { ...w, elements: [...w.elements, newElement] }
            : w
        )
      };

      updateAndSaveProject(updatedProject);
      setSelectedElement(newElement.id);
      showToast(`Ícone ${iconData.iconName} adicionado com sucesso!`, 'success');
      return;
    }
    
    let toolType = draggedTool;
    if (!toolType) {
      toolType = e.dataTransfer.getData('application/x-wireframe-tool') || 
                e.dataTransfer.getData('text/plain');
    }
    
    if (!toolType) {
      return;
    }
    
    const getMinimumSize = (type: string) => {
      switch (type) {
        case 'text': return { width: 100, height: 30 };
        case 'button': return { width: 80, height: 35 };
        case 'image': 
        case 'video': return { width: 120, height: 80 };
        case 'icon': return { width: Math.max(24, 40), height: Math.max(24, 40) };
        case 'line': return { width: 100, height: 2 };
        case 'circle': return { width: 60, height: 60 };
        default: return { width: 80, height: 60 };
      }
    };

    const minSize = getMinimumSize(toolType);
    
    const elementX = Math.max(0, Math.min(canvasDimensions.width - minSize.width, x - minSize.width / 2));
    const elementY = Math.max(0, Math.min(canvasDimensions.height - minSize.height, y - minSize.height / 2));
    
    const newElement: WireframeElement = {
      id: Date.now().toString(),
      type: toolType as any,
      x: elementX,
      y: elementY,
      width: minSize.width,
      height: minSize.height,
      text: toolType === 'text' ? 'Texto' : toolType === 'button' ? 'Button' : undefined,
      backgroundColor: toolType === 'text' ? 'transparent' : '#ffffff',
      textLevel: toolType === 'text' ? 'h3' : toolType === 'button' ? 'p' : undefined,
      textColor: 'var(--foreground)',
      textAlign: 'center',
      zIndex: 0,
      borderWidth: toolType === 'text' ? 0 : 2,
      borderColor: '#d1d5db',
      imageSrc: toolType === 'image' ? imageplaceholder : undefined,
      videoSrc: toolType === 'video' ? videoplaceholder : undefined,
      iconName: toolType === 'icon' ? 'Star' : undefined,
    };

    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w => 
        w.id === activeWireframe 
          ? { ...w, elements: [...w.elements, newElement] }
          : w
      )
    };

    updateAndSaveProject(updatedProject);
    setDraggedTool(null);
    setSelectedElement(newElement.id);
    
    const elementTypeNames = {
      'text': 'Texto',
      'button': 'Botão',
      'rectangle': 'Retângulo',
      'circle': 'Círculo',
      'line': 'Linha',
      'image': 'Imagem',
      'video': 'Vídeo',
      'icon': 'Ícone'
    };
    
    showToast(`${elementTypeNames[toolType as keyof typeof elementTypeNames] || 'Elemento'} adicionado com sucesso!`, 'success');
  };

  const handleAddWireframe = () => {
    if (!newWireframeName.trim()) return;
    triggerUnsyncedState();
    const newWireframe: Wireframe = {
      id: Date.now().toString(),
      name: newWireframeName.trim(),
      elements: []
    };

    const updatedProject = {
      ...project,
      wireframes: [...project.wireframes, newWireframe]
    };

    updateAndSaveProject(updatedProject);
    setActiveWireframe(newWireframe.id);
    setIsAddWireframeOpen(false);
    setNewWireframeName('');
    showToast('Nova tela criada com sucesso!', 'success');
  };

  const handleDeleteWireframe = (wireframeId: string) => {
    if (project.wireframes.length <= 1) {
      showToast('Não é possível excluir a última tela de usuário!', 'error');
      return;
    }
    triggerUnsyncedState();
    const updatedProject = {
      ...project,
      wireframes: project.wireframes.filter(w => w.id !== wireframeId)
    };

    if (activeWireframe === wireframeId) {
      setActiveWireframe(updatedProject.wireframes[0]?.id || '');
    }

    updateAndSaveProject(updatedProject);
    showToast('Wireframe excluído com sucesso!', 'success');
  };

  const handleGridConfigChange = (newConfig: GridConfig) => {
    triggerUnsyncedState();
    setGridConfig(newConfig);
    const updatedProject = {
      ...project,
      gridConfig: newConfig
    };
    updateAndSaveProject(updatedProject);
  };

  const copyElement = () => {
    if (selectedElement && currentWireframe) {
      const element = currentWireframe.elements.find(el => el.id === selectedElement);
      if (element) {
        setCopiedElement({ ...element });
        showToast(`${element.type === 'text' ? 'Texto' : element.type === 'button' ? 'Botão' : 'Elemento'} copiado!`, 'success');
      }
    }
  };

  const addIconFromLibrary = (iconName: string) => {
    if (!currentWireframe) return;
    triggerUnsyncedState();
    const minSize = { width: 40, height: 40 };
    const x = canvasDimensions.width / 2 - minSize.width / 2;
    const y = canvasDimensions.height / 2 - minSize.height / 2;

    const newElement: WireframeElement = {
      id: Date.now().toString(),
      type: 'icon',
      x: Math.max(0, Math.min(canvasDimensions.width - minSize.width, x)),
      y: Math.max(0, Math.min(canvasDimensions.height - minSize.height, y)),
      width: minSize.width,
      height: minSize.height,
      backgroundColor: 'transparent',
      textColor: 'var(--foreground)',
      zIndex: (currentWireframe.elements.length || 0) + 1,
      borderWidth: 0,
      iconName: iconName,
      iconComponent: iconName,
    };

    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w =>
        w.id === activeWireframe
          ? { ...w, elements: [...w.elements, newElement] }
          : w
      )
    };

    updateAndSaveProject(updatedProject);
    setSelectedElement(newElement.id);
    showToast(`Ícone ${iconName} adicionado com sucesso!`, 'success');
  };

  const pasteElement = () => {
    if (copiedElement && currentWireframe) {
      triggerUnsyncedState();
      const newElement: WireframeElement = {
        ...copiedElement,
        id: Date.now().toString(),
        x: Math.min(copiedElement.x + 20, canvasDimensions.width - copiedElement.width),
        y: Math.min(copiedElement.y + 20, canvasDimensions.height - copiedElement.height),
        name: copiedElement.name ? `${copiedElement.name} - Cópia` : undefined
      };

      const updatedProject = {
        ...project,
        wireframes: project.wireframes.map(w => 
          w.id === activeWireframe 
            ? { ...w, elements: [...w.elements, newElement] }
            : w
        )
      };

      updateAndSaveProject(updatedProject);
      setSelectedElement(newElement.id);
      showToast(`${newElement.type === 'text' ? 'Texto' : newElement.type === 'button' ? 'Botão' : 'Elemento'} colado!`, 'success');
    }
  };

  const moveElementWithKeyboard = (direction: 'up' | 'down' | 'left' | 'right', step: number = 1) => {
    if (!selectedElement || !currentWireframe) return;
    triggerUnsyncedState();
    const element = currentWireframe.elements.find(el => el.id === selectedElement);
    if (!element) return;

    let newX = element.x;
    let newY = element.y;

    switch (direction) {
      case 'up':
        newY = Math.max(0, element.y - step);
        break;
      case 'down':
        newY = Math.min(canvasDimensions.height - element.height, element.y + step);
        break;
      case 'left':
        newX = Math.max(0, element.x - step);
        break;
      case 'right':
        newX = Math.min(canvasDimensions.width - element.width, element.x + step);
        break;
    }

    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w => 
        w.id === activeWireframe 
          ? { 
              ...w, 
              elements: w.elements.map(el => 
                el.id === selectedElement 
                  ? { ...el, x: newX, y: newY } 
                  : el
              ) 
            }
          : w
      )
    };

    updateAndSaveProject(updatedProject);
  };

  const handleDeleteSelectedElement = () => {
    if (!selectedElement || !currentWireframe) return;
    triggerUnsyncedState();
    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w => 
        w.id === activeWireframe 
          ? { ...w, elements: w.elements.filter(el => el.id !== selectedElement) }
          : w
      )
    };

    updateAndSaveProject(updatedProject);
    setSelectedElement(null);
    showToast('Elemento excluído!', 'success');
  };

  const handleCanvasMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedElement(null);
    }
  }, []);

  const handleCanvasPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();

    if (!currentWireframe || !stageRef.current) {
      showToast('Nenhuma tela ativa ou canvas não disponível.', 'error');
      return;
    }
    triggerUnsyncedState();
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageSrc = event.target?.result as string;
            if (imageSrc) {
              const stage = stageRef.current;
              if (!stage) return;

              const pointerPosition = stage.getPointerPosition();
              const x = pointerPosition ? pointerPosition.x : canvasDimensions.width / 2;
              const y = pointerPosition ? pointerPosition.y : canvasDimensions.height / 2;

              const newElement: WireframeElement = {
                id: Date.now().toString(),
                type: 'image',
                x: Math.max(0, Math.min(canvasDimensions.width - 150, x - 75)),
                y: Math.max(0, Math.min(canvasDimensions.height - 100, y - 50)),
                width: 150,
                height: 100,
                imageSrc: imageSrc,
                zIndex: (currentWireframe.elements.length || 0) + 1,
                backgroundColor: 'transparent',
                borderWidth: 0,
              };

              const updatedProject = {
                ...project,
                wireframes: project.wireframes.map(w =>
                  w.id === activeWireframe
                    ? { ...w, elements: [...w.elements, newElement] }
                    : w
                )
              };

              updateAndSaveProject(updatedProject);
              setSelectedElement(newElement.id);
              showToast('Imagem colada com sucesso!', 'success');
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }
    showToast('Nenhuma imagem encontrada na área de transferência.', 'info');
  }, [project, activeWireframe, onUpdateProject, showToast, stageRef, canvasDimensions, setSelectedElement, currentWireframe]);

  const handleElementMouseDown = useCallback((elementId: string) => {
    setSelectedElement(elementId);
  }, []);

  const handleElementDragEnd = useCallback((elementId: string, newX: number, newY: number) => {
    updateElementProperties(elementId, { x: newX, y: newY });
  }, [updateElementProperties]);

  const handleElementTransformEnd = useCallback((elementId: string, newX: number, newY: number, newWidth: number, newHeight: number) => {
    updateElementProperties(elementId, { x: newX, y: newY, width: newWidth, height: newHeight });
  }, [updateElementProperties]);

  const selectedElementData = selectedElement && currentWireframe?.elements.find(el => el.id === selectedElement);

  const handlePublish = async (wireframesToPublish: Wireframe[]) => {
    console.log('Publishing wireframes:', wireframesToPublish);
    showToast('Wireframe publicado com sucesso!', 'success');
    setIsPublishModalOpen(false);
  };

  const handleDownloadWireframe = async () => {
    if (!stageRef.current || !currentWireframe) {
      showToast('Nenhum wireframe ativo ou canvas não disponível para download.', 'error');
      return;
    }

    const stage = stageRef.current;
    try {
      const svgString = await exportStageSVG(stage);

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentWireframe.name.replace(/\s/g, '_')}_${project.resolution}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Wireframe baixado como SVG com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao exportar SVG:', error);
      showToast(`Erro ao baixar wireframe: ${error.message || error.toString()}`, 'error');
    }
  };

  const handleImportWireframe = (importedWireframeData: { name: string; svg: string }) => {
    try {
      triggerUnsyncedState();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(importedWireframeData.svg, "image/svg+xml");
      const svgElements: WireframeElement[] = [];

      svgDoc.querySelectorAll('rect').forEach(rect => {
        const id = uuidv4();
        const x = parseFloat(rect.getAttribute('x') || '0');
        const y = parseFloat(rect.getAttribute('y') || '0');
        const width = parseFloat(rect.getAttribute('width') || '0');
        const height = parseFloat(rect.getAttribute('height') || '0');
        const fill = rect.getAttribute('fill') || 'transparent';
        const stroke = rect.getAttribute('stroke') || 'none';
        const borderWidth = parseFloat(rect.getAttribute('stroke-width') || '0');
        const rx = parseFloat(rect.getAttribute('rx') || '0');

        if (height <= 5 && borderWidth === 0) {
          svgElements.push({
            id,
            type: 'line',
            x,
            y,
            width,
            height,
            textColor: fill,
            borderWidth: 0,
          });
        } else {
          svgElements.push({
            id,
            type: 'rectangle',
            x,
            y,
            width,
            height,
            backgroundColor: fill,
            borderColor: stroke,
            borderWidth,
            borderTopLeftRadius: rx,
            borderTopRightRadius: rx,
            borderBottomLeftRadius: rx,
            borderBottomRightRadius: rx,
          });
        }
      });

      svgDoc.querySelectorAll('circle').forEach(circle => {
        const id = uuidv4();
        const cx = parseFloat(circle.getAttribute('cx') || '0');
        const cy = parseFloat(circle.getAttribute('cy') || '0');
        const r = parseFloat(circle.getAttribute('r') || '0');
        const fill = circle.getAttribute('fill') || 'transparent';
        const stroke = circle.getAttribute('stroke') || 'none';
        const borderWidth = parseFloat(circle.getAttribute('stroke-width') || '0');

        svgElements.push({
          id,
          type: 'circle',
          x: cx - r,
          y: cy - r,
          width: r * 2,
          height: r * 2,
          backgroundColor: fill,
          borderColor: stroke,
          borderWidth,
        });
      });

      svgDoc.querySelectorAll('text').forEach(text => {
        const id = uuidv4();
        const x = parseFloat(text.getAttribute('x') || '0');
        const y = parseFloat(text.getAttribute('y') || '0');
        const fontSize = parseFloat(text.getAttribute('font-size') || '16');
        const textColor = text.getAttribute('fill') || 'black';
        const textContent = text.textContent || '';
        const textAnchor = text.getAttribute('text-anchor') || 'start';

        const estimatedWidth = textContent.length * (fontSize * 0.6);
        const estimatedHeight = fontSize * 1.2;

        svgElements.push({
          id,
          type: 'text',
          x: textAnchor === 'middle' ? x - estimatedWidth / 2 : x,
          y: y - fontSize / 2,
          width: estimatedWidth,
          height: estimatedHeight,
          text: textContent,
          textColor,
          textAlign: textAnchor === 'middle' ? 'center' : textAnchor === 'end' ? 'right' : 'left',
          textLevel: 'p',
        });
      });

      svgDoc.querySelectorAll('image').forEach(image => {
        const id = uuidv4();
        const x = parseFloat(image.getAttribute('x') || '0');
        const y = parseFloat(image.getAttribute('y') || '0');
        const width = parseFloat(image.getAttribute('width') || '0');
        const height = parseFloat(image.getAttribute('height') || '0');
        const href = image.getAttribute('href') || '';

        svgElements.push({
          id,
          type: 'image',
          x,
          y,
          width,
          height,
          imageSrc: href,
        });
      });

      const newWireframe: Wireframe = {
        id: uuidv4(),
        name: importedWireframeData.name,
        elements: svgElements,
      };

      const updatedProject = {
        ...project,
        wireframes: [...project.wireframes, newWireframe],
      };

      updateAndSaveProject(updatedProject);
      setActiveWireframe(newWireframe.id);
      showToast(`Tela "${newWireframe.name}" importada com sucesso!`, 'success');
    } catch (error: any) {
      console.error('Erro ao importar wireframe:', error);
      showToast(`Erro ao importar wireframe: ${error.message || error.toString()}`, 'error');
    }
  };

  if (!currentWireframe) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tailwind Purge Safelist: bg-green-500 bg-red-500 */}
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Wireframe Tabs */}
          <div className="flex items-center gap-2">
            {project.wireframes
              .map((wireframe) => (
              <Button
                key={wireframe.id}
                variant={activeWireframe === wireframe.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveWireframe(wireframe.id)}
                className="relative"
              >
                {wireframe.name}
                {project.wireframes.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWireframe(wireframe.id);
                    }}
                    className="ml-2 hover:bg-destructive hover:text-destructive-foreground rounded-sm p-0.5 cursor-pointer"
                  >
                    ×
                  </span>
                )}
              </Button>
            ))}
            
            <Dialog open={isAddWireframeOpen} onOpenChange={setIsAddWireframeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Tela</DialogTitle>
                  <DialogDescription>
                    Crie uma nova tela para seu wireframe
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="wireframe-name">Nome da tela</Label>
                    <Input
                      id="wireframe-name"
                      value={newWireframeName}
                      onChange={(e) => setNewWireframeName(e.target.value)}
                      placeholder="Ex: Tela de Login"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddWireframeOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddWireframe}>
                      Criar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPublishModalOpen(true)}>
            Publicar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadWireframe}>
            Baixar Wireframe
          </Button>
          <div className="relative flex items-center gap-2">
            <Button
              className={`relative flex items-center gap-2 ${saveStatus === 'Atualizar' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
              size="sm"
              onClick={handleSaveProject}
              disabled={saveStatus === "Salvando..." || saveStatus === "Verificando..."}
            >
              <Save className="w-4 h-4" />

              {saveStatus === "Salvando..." || saveStatus === "Verificando..."
                ? saveStatus
                : saveStatus === "Atualizar"
                ? "Atualizar"
                : "Atualizado"}

              <Signal unsavedWarning={saveStatus === 'Atualizar'} />

            </Button>

              
              <span className="text-sm text-muted-foreground min-w-[100px]">{saveStatus}</span>
         
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsLibraryModalOpen(true)}>
            Biblioteca
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar - Element Tree */}
          <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
            <div className="h-full border-r border-border bg-card p-4 overflow-y-auto">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4" />
                  Estrutura dos Elementos
                </Label>
                <ElementTree
                  elements={currentWireframe.elements}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  onUpdateElement={updateElementProperty}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Canvas */}
          <ResizablePanel defaultSize={64} minSize={40}>
            <div
              ref={canvasContainerRef}
              tabIndex={0}
              onMouseEnter={() => (isPointerInsideRef.current = true)}
              onMouseLeave={() => (isPointerInsideRef.current = false)}
              onFocus={() => (isPointerInsideRef.current = true)}
              onBlur={() => (isPointerInsideRef.current = false)}
              style={{ touchAction: 'none' }}
              className="h-full w-full bg-gray-50 overflow-auto"
              onDragOver={handleCanvasDragOver}
              onDragLeave={handleCanvasDragLeave}
              onDrop={handleCanvasDrop}
              onPaste={handleCanvasPaste}
            >
              {/* This container centers the canvas and provides the gray border via padding */}
              <div className="flex items-center justify-center min-h-full min-w-full p-8">
                <div
                  className={`relative bg-white shadow-lg ${isDragOverCanvas ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                  style={{
                    width: canvasDimensions.width,
                    height: canvasDimensions.height,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center',
                  }}
                  data-canvas-background="true"
                >
                  <WireframeCanvas
                    ref={stageRef}
                    project={project}
                    wireframe={currentWireframe}
                    zoom={1} // Konva's internal zoom is 1, we scale the parent div
                    onSelectElement={handleElementMouseDown}
                    selectedElementId={selectedElement}
                    onUpdateElement={updateElementProperty}
                    onElementDragEnd={handleElementDragEnd}
                    onElementTransformEnd={handleElementTransformEnd}
                    canvasDimensions={canvasDimensions}
                    gridConfig={gridConfig}
                    getFontSize={getFontSize}
                    getFontFamilyCSS={getFontFamilyCSS}
                    getElementMinimumSize={getElementMinimumSize}
                    onCanvasMouseDown={handleCanvasMouseDown}
                  />
                  <GridOverlay gridConfig={gridConfig} width={canvasDimensions.width} />
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - Components & Properties */}
          <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
            <div className="h-full border-l border-border bg-card">
              <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as 'components' | 'properties')} className="h-full flex flex-col">
                <TabsList className="w-full flex-shrink-0">
                  <TabsTrigger value="components" className="flex-1">Componentes</TabsTrigger>
                  <TabsTrigger value="properties" className="flex-1">Propriedades</TabsTrigger>
                </TabsList>

                <TabsContent value="components" className="flex-1 p-4 space-y-6 overflow-y-auto">
                  {/* Drawing Tools */}
                  <div>
                    <Label className="text-sm font-medium">Ferramentas de Desenho</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1"
                        onDragStart={(e) => handleToolDragStart(e, 'rectangle')}
                        onDragEnd={handleDragEnd}
                        draggable
                      >
                        <Square className="w-4 h-4" />
                        <span className="text-xs">Retângulo</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1"
                        onDragStart={(e) => handleToolDragStart(e, 'circle')}
                        onDragEnd={handleDragEnd}
                        draggable
                      >
                        <Circle className="w-4 h-4" />
                        <span className="text-xs">Círculo</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1"
                        onDragStart={(e) => handleToolDragStart(e, 'line')}
                        onDragEnd={handleDragEnd}
                        draggable
                      >
                        <Minus className="w-4 h-4" />
                        <span className="text-xs">Linha</span>
                      </Button>
                    </div>
                  </div>

                  {/* UI Elements */}
                  <div>
                    <Label className="text-sm font-medium">Elementos UI</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1"
                        onDragStart={(e) => handleToolDragStart(e, 'text')}
                        onDragEnd={handleDragEnd}
                        draggable
                      >
                        <Type className="w-4 h-4" />
                        <span className="text-xs">Texto</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1"
                        onDragStart={(e) => handleToolDragStart(e, 'button')}
                        onDragEnd={handleDragEnd}
                        draggable
                      >
                        <MousePointer className="w-4 h-4" />
                        <span className="text-xs">Botão</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1"
                        onDragStart={(e) => handleToolDragStart(e, 'image')}
                        onDragEnd={handleDragEnd}
                        draggable
                      >
                        <Image className="w-4 h-4" />
                        <span className="text-xs">Imagem</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1"
                        onDragStart={(e) => handleToolDragStart(e, 'video')}
                        onDragEnd={handleDragEnd}
                        draggable
                      >
                        <Video className="w-4 h-4" />
                        <span className="text-xs">Vídeo</span>
                      </Button>
                    </div>
                  </div>

                  {/* Icons Library */}
                  <IconLibrary onSelectIcon={(iconName, iconComponent) => addIconFromLibrary(iconName)} />

                  {/* Grid Settings */}
                  <div>
                    <Label className="text-sm font-medium">Configurações do Grid</Label>
                    <div className="mt-2">
                      <GridSettings
                        config={gridConfig}
                        onChange={handleGridConfigChange}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="properties" className="flex-1 p-4 overflow-y-auto">
                  {selectedElementData ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Elemento Selecionado</Label>
                        <p className="text-sm text-muted-foreground capitalize">{selectedElementData.type}</p>
                      </div>

                      {/* Dimensions */}
                      <DimensionEditor
                        element={selectedElementData}
                        onUpdate={(property, value) => updateElementProperty(selectedElementData.id, property, value)}
                        canvasDimensions={canvasDimensions}
                        resolution={project.resolution}
                      />

                      {/* Smart Editor Button */}
                      {selectedElementData.type === 'text' && (
                        <div className="pt-2">
                          <Button
                            onClick={() => setIsTextEditorOpen(true)}
                            className="w-full flex items-center gap-2"
                            variant="outline"
                          >
                            <Edit3 className="w-4 h-4" />
                            Editor Inteligente
                          </Button>
                        </div>
                      )}

                      {/* Text Properties */}
                      {(selectedElementData.type === 'text' || selectedElementData.type === 'button') && (
                        <>
                          <div>
                            <Label htmlFor="element-text">Texto</Label>
                            <Input
                              id="element-text"
                              value={selectedElementData.text || ''}
                              onChange={(e) => updateElementProperty(selectedElementData.id, 'text', e.target.value)}
                            />
                          </div>

                          <FontLevelPicker
                            value={selectedElementData.textLevel || 'p'}
                            onChange={(value) => updateElementProperty(selectedElementData.id, 'textLevel', value)}
                            resolution={project.resolution}
                          />

                          <TextColorPicker
                            value={selectedElementData.textColor || 'var(--foreground)'}
                            onChange={(value) => updateElementProperty(selectedElementData.id, 'textColor', value)}
                          />

                          <TextAlignPicker
                            value={selectedElementData.textAlign || 'left'}
                            onChange={(value) => updateElementProperty(selectedElementData.id, 'textAlign', value)}
                          />
                        </>
                      )}

                      {/* Navigation Target for Buttons */}
                      {selectedElementData.type === 'button' && (
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" />
                            Navegação
                          </Label>
                          <Select
                            value={selectedElementData.navigationTarget || ''}
                            onValueChange={(value) => updateElementProperty(selectedElementData.id, 'navigationTarget', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Selecione a tela de destino" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma navegação</SelectItem>
                              {project.wireframes
                                .filter(w => w.id !== activeWireframe)
                                .map(wireframe => (
                                  <SelectItem key={wireframe.id} value={wireframe.id}>
                                    {wireframe.name}
                                  </SelectItem>
                                ))}
                              <SelectItem key="__FINISH_TEST__" value="__FINISH_TEST__">
                                Finalizar Teste
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Background Color */}
                      {selectedElementData.type !== 'text' && selectedElementData.type !== 'line' && (
                        <ColorPicker
                          label="Cor de Fundo"
                          value={selectedElementData.backgroundColor || '#ffffff'}
                          onChange={(value) => updateElementProperty(selectedElementData.id, 'backgroundColor', value)}
                        />
                      )}

                      {/* Border */}
                      {selectedElementData.type !== 'text' && selectedElementData.type !== 'line' && (
                        <>
                          <BorderWidthPicker
                            value={selectedElementData.borderWidth || 0}
                            onChange={(value) => updateElementProperty(selectedElementData.id, 'borderWidth', value)}
                          />

                          <BorderColorPicker
                            value={selectedElementData.borderColor || '#d1d5db'}
                            onChange={(value) => updateElementProperty(selectedElementData.id, 'borderColor', value)}
                          />
                        </>
                      )}

                     

                      {/* Border Radius */}
                      {(selectedElementData.type === 'rectangle' || selectedElementData.type === 'button') && (
                        <BorderRadiusPicker
                          topLeft={selectedElementData.borderTopLeftRadius || 0}
                          topRight={selectedElementData.borderTopRightRadius || 0}
                          bottomLeft={selectedElementData.borderBottomLeftRadius || 0}
                          bottomRight={selectedElementData.borderBottomRightRadius || 0}
                          onChange={(corner, value) => {
                            const propertyName = `border${corner.charAt(0).toUpperCase() + corner.slice(1)}Radius`;
                            updateElementProperty(selectedElementData.id, propertyName, value);
                          }}
                          elementId={selectedElementData.id}
                        />
                      )}

                      {/* Icon Selection */}
                      {selectedElementData.type === 'icon' && (
                        <div>
                          <Label className="text-sm font-medium">Escolher Ícone</Label>
                          <div className="mt-2">
                            <IconLibrary
                              onSelectIcon={(iconName, iconComponent) => {
                                updateElementProperty(selectedElementData.id, 'iconName', iconName);
                                updateElementProperty(selectedElementData.id, 'iconComponent', iconName);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Z-Index Controls */}
                      <div>
                        <Label className="text-sm font-medium">Camada</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateElementProperty(selectedElementData.id, 'zIndex', Math.max(0, (selectedElementData.zIndex || 0) - 1))}
                            title="Enviar para trás"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateElementProperty(selectedElementData.id, 'zIndex', (selectedElementData.zIndex || 0) + 1)}
                            title="Trazer para frente"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Delete Element */}
                      <div className="pt-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteSelectedElement}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Elemento
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Selecione um elemento para editar suas propriedades</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <TextEditor
        isOpen={isTextEditorOpen}
        onClose={() => setIsTextEditorOpen(false)}
        element={selectedElementData || null}
        onApplyChanges={handleApplyTextChanges}
      />

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        wireframes={project.wireframes}
        onPublish={handlePublish}
      />

      <LibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onImportWireframe={handleImportWireframe}
      />
       {/* Tailwind Purge Safelist: bg-green-500 bg-red-500 */}
    </div>
  );
}
