import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
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
import FigmaImportModal from './FigmaImportModal';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../utils/supabase/client';
import { saveOrUpdateProject, getProjectById } from '../utils/supabase/supabaseClient';
import { iconIndex } from './icon-index';
import Konva from 'konva'; // Keep Konva import
import { exportStageSVG } from 'react-konva-to-svg';
import { WireframeCanvas } from './WireframeCanvas'; // Keep WireframeCanvas import
import GridOverlay from './GridOverlay';
import { Signal } from './Signal';
import { convertFigmaToWireframes, FigmaFile } from '../utils/figmaImporter';
import { FloatingToolbar } from './FloatingToolbar';
import MockupView from './MockupView';
import { Flex, Spin } from 'antd';
import { useWindowHeight } from '../hooks/useWindowHeight';
import imgplaceholder from "../assets/image.png";
import mpplaceholder from "../assets/video.jpg";


const imageplaceholder = imgplaceholder;
const videoplaceholder = mpplaceholder;

import {
  ArrowLeft,
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
  Star, // Added Star for default icon rendering
  Check,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import Frame from './Frame';

interface WireframeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon' | 'frame';
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
  iconId?: string;
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  parentId?: string;
  name?: string;
  opacity?: number; // Adicionado para controlar a transparência da imagem
  enhance?: number;
  // Advanced text properties
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
  // Auto Layout properties for frames
  layoutMode?: 'none' | 'horizontal' | 'vertical';
  padding?: number;
  itemSpacing?: number;
}

interface Wireframe {
  id: string;
  name: string;
  elements: WireframeElement[];
  width?: number;
  height?: number;
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
  resolution: 'mobile' | 'tablet' | 'desktop' | 'custom';
  width?: number;
  height?: number;
  wireframes: Wireframe[];
  createdAt: string;
  gridConfig?: GridConfig;
  figmaFileKey?: string;
  figmaToken?: string;
}

interface WireframeEditorProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onBack: () => void;
}

const getFontSize = (element: WireframeElement, resolution: 'mobile' | 'tablet' | 'desktop' | 'custom') => {
  if (element.fontSize) {
    return element.fontSize;
  }

  const fontSizes = {
    desktop: {
      h1: 40, h2: 32, h3: 28, h4: 24, h5: 20, h6: 16, p: 16
    },
    tablet: {
      h1: 32, h2: 28, h3: 24, h4: 20, h5: 18, h6: 16, p: 15
    },
    mobile: {
      h1: 28, h2: 24, h3: 20, h4: 18, h5: 16, h6: 14, p: 14
    },
    custom: {
      h1: 40, h2: 32, h3: 28, h4: 24, h5: 20, h6: 16, p: 16
    }
  };

  const level = element.textLevel || 'p';
  const res = resolution || 'desktop';

  if (!fontSizes[res]) {
    return fontSizes.desktop[level];
  }

  return fontSizes[res][level];
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

const getElementMinimumSize = (elementType: string) => {
  switch (elementType) {
    case 'icon': return 14;
    case 'line': return 2;
    default: return 5;
  }
};

export function WireframeEditor({ project, onUpdateProject, onBack }: WireframeEditorProps) {
  const [internalProject, setInternalProject] = useState<Project>(project);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeWireframe, setActiveWireframe] = useState<string>('none');
  const [zoom, setZoom] = useState(1);
  const [sidebarTab, setSidebarTab] = useState<'components' | 'properties'>('components');
  const [gridConfig, setGridConfig] = useState<GridConfig>(
    project.gridConfig || {
      enabled: false, columns: 12, gap: 16, margin: 24, color: 'red', opacity: 0.1
    }
  );
  const [draggedTool, setDraggedTool] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [isAddWireframeOpen, setIsAddWireframeOpen] = useState(false);
  const [newWireframeName, setNewWireframeName] = useState('');
  const [copiedElement, setCopiedElement] = useState<WireframeElement | null>(null);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isFigmaImportModalOpen, setIsFigmaImportModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'Atualizado' | 'Atualizar' | 'Salvando...' | 'Verificando...' | 'Erro ao salvar'>('Atualizado');
  const [activeMockup, setActiveMockup] = useState<string | null>(null);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isXRayMode, setIsXRayMode] = useState(false);
  const windowHeight = useWindowHeight();
  const topBarRef = useRef<HTMLDivElement>(null);
  const [topBarHeight, setTopBarHeight] = useState(0);

  useEffect(() => {
    if (topBarRef.current) {
      setTopBarHeight(topBarRef.current.offsetHeight);
    }
  }, [topBarRef.current]);


  const stageRef = useRef<Konva.Stage>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const isPointerInsideRef = useRef(false);
  const scrollPos = useRef({ left: 0, top: 0, shouldUpdate: false });
  const scrollTarget = useRef({ left: 0, top: 0, apply: false });
  const { showToast } = useToast();

  const hasLocalChangesRef = useRef(false);
  const unsavedChangesToastShownRef = useRef(false);

  const saveProjectLocally = useCallback((currentProject: Project) => {
    try {
      localStorage.setItem(`wireframe_project_${currentProject.id}`, JSON.stringify(currentProject));
      hasLocalChangesRef.current = true;
      setSaveStatus('Atualizar');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        showToast('Não foi possível salvar as alterações localmente pois o projeto é muito grande. Salve no servidor para não perder as alterações.', 'error');
        setSaveStatus('Erro ao salvar');
      } else {
        console.error("Failed to save project locally", e);
      }
    }
  }, [showToast]);

  const updateAndSaveProject = (updatedProject: Project) => {
    setInternalProject(updatedProject);
    saveProjectLocally(updatedProject);
  };

  useEffect(() => {
    const localProjectJson = localStorage.getItem(`wireframe_project_${project.id}`);
    if (localProjectJson) {
      try {
        const localProject = JSON.parse(localProjectJson);
        if (JSON.stringify(localProject.wireframes) !== JSON.stringify(project.wireframes) ||
            JSON.stringify(localProject.gridConfig) !== JSON.stringify(project.gridConfig)) {
          setInternalProject(localProject);
          setGridConfig(localProject.gridConfig || { enabled: false, columns: 12, gap: 16, margin: 24, color: 'red', opacity: 0.1 });
          setSaveStatus('Atualizar');
          hasLocalChangesRef.current = true;
          if (!unsavedChangesToastShownRef.current) {
            showToast("Encontramos alterações não salvas localmente. Clique em 'Atualizar' para sincronizar.", "info");
            unsavedChangesToastShownRef.current = true;
          }
        } else {
          setInternalProject(project);
          setGridConfig(project.gridConfig || { enabled: false, columns: 12, gap: 16, margin: 24, color: 'red', opacity: 0.1 });
          setSaveStatus('Atualizado');
          hasLocalChangesRef.current = false;
          localStorage.removeItem(`wireframe_project_${project.id}`);
        }
      } catch (e) {
        console.error("Error loading project from localStorage:", e);
        setInternalProject(project);
        localStorage.removeItem(`wireframe_project_${project.id}`);
      }
    } else {
      setInternalProject(project);
      setGridConfig(project.gridConfig || { enabled: false, columns: 12, gap: 16, margin: 24, color: 'red', opacity: 0.1 });
      setSaveStatus('Atualizado');
      hasLocalChangesRef.current = false;
    }
  }, [project, showToast]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasLocalChangesRef.current) {
        return undefined;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  const handleSaveProject = async () => {
    setSaveStatus('Salvando...');
    try {
      await saveOrUpdateProject(internalProject);
      onUpdateProject(internalProject);
      localStorage.removeItem(`wireframe_project_${internalProject.id}`);
      hasLocalChangesRef.current = false;
      setSaveStatus('Atualizado');
      showToast('Projeto salvo com sucesso!', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(`Erro ao salvar: ${error.message}`, 'error');
      }
      setSaveStatus('Erro ao salvar');
    }
  };

  const currentWireframe = activeWireframe !== 'none' ? internalProject.wireframes.find(w => w.id === activeWireframe) : null;

  const getDimensionsForResolution = (resolution: 'mobile' | 'tablet' | 'desktop' | 'custom', projectWidth?: number, projectHeight?: number) => {
    switch (resolution) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1440, height: 900 };
      case 'custom': return { width: projectWidth || 1920, height: projectHeight || 1080 };
      default: return { width: 1920, height: 1080 };
    }
  };

  const getCanvasDimensions = () => {
    if (currentWireframe && currentWireframe.width && currentWireframe.height) {
        return { width: currentWireframe.width, height: currentWireframe.height };
    }
    return getDimensionsForResolution(internalProject.resolution, internalProject.width, internalProject.height);
  };

  const canvasDimensions = getCanvasDimensions();

  const triggerUnsyncedState = () => {};

  const updateElementProperties = useCallback((elementId: string, props: Partial<WireframeElement>) => {
    triggerUnsyncedState();
    const updatedProject = {
      ...internalProject,
      wireframes: internalProject.wireframes.map(w =>
        activeWireframe !== 'none' && w.id === activeWireframe
          ? {
              ...w,
              elements: w.elements.map(el => {
                if (el.id === elementId) {
                  const updatedEl = { ...el, ...props };

                  if (props.hasOwnProperty('parentId') && props.parentId === undefined) {
                    delete updatedEl.parentId;
                  }

                  if (updatedEl.type === 'icon') {
                    if (props.width !== undefined) {
                      updatedEl.width = Math.max(14, props.width);
                    }
                    if (props.height !== undefined) {
                      updatedEl.height = Math.max(14, props.height);
                    }
                  }

                  return updatedEl;
                }
                return el;
              })
            }
          : w
      )
    };
    updateAndSaveProject(updatedProject);
  }, [internalProject, activeWireframe]);

  const updateElementProperty = useCallback((elementId: string, property: string, value: any) => {
    updateElementProperties(elementId, { [property]: value });
  }, [updateElementProperties]);

  const handleApplyTextChanges = (changes: Partial<WireframeElement>) => {
    if (!selectedElement) return;
    triggerUnsyncedState();
    const updatedProject = {
      ...internalProject,
      wireframes: internalProject.wireframes.map(w =>
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

  const updateFrameLayout = useCallback((frameId: string) => {
    const wireframe = internalProject.wireframes.find(w => w.id === activeWireframe);
    if (!wireframe) return;

    const frame = wireframe.elements.find(e => e.id === frameId);
    if (!frame || !frame.layoutMode || frame.layoutMode === 'none') {
      return;
    }

    const children = wireframe.elements.filter(e => e.parentId === frameId);
    
    const padding = frame.padding || 0;
    const spacing = frame.itemSpacing || 0;

    let currentX = padding;
    let currentY = padding;
    let maxInSecondaryAxis = 0;

    const updates: { elementId: string, props: Partial<WireframeElement> }[] = [];

    children.forEach(child => {
      updates.push({ elementId: child.id, props: { x: currentX, y: currentY } });
      if (frame.layoutMode === 'horizontal') {
        currentX += child.width + spacing;
        maxInSecondaryAxis = Math.max(maxInSecondaryAxis, child.height);
      } else { // vertical
        currentY += child.height + spacing;
        maxInSecondaryAxis = Math.max(maxInSecondaryAxis, child.width);
      }
    });

    let newFrameWidth: number;
    let newFrameHeight: number;

    if (children.length === 0) {
      newFrameWidth = padding * 2;
      newFrameHeight = padding * 2;
    } else if (frame.layoutMode === 'horizontal') {
      newFrameWidth = currentX - spacing + padding;
      newFrameHeight = maxInSecondaryAxis + padding * 2;
    } else { // vertical
      newFrameWidth = maxInSecondaryAxis + padding * 2;
      newFrameHeight = currentY - spacing + padding;
    }

    updates.push({ elementId: frame.id, props: { width: newFrameWidth, height: newFrameHeight } });

    // Batch update all properties
    const updatedProject = {
      ...internalProject,
      wireframes: internalProject.wireframes.map(w =>
        w.id === activeWireframe
          ? {
              ...w,
              elements: w.elements.map(el => {
                const update = updates.find(u => u.elementId === el.id);
                return update ? { ...el, ...update.props } : el;
              })
            }
          : w
      )
    };
    updateAndSaveProject(updatedProject);

  }, [internalProject, activeWireframe, updateAndSaveProject]);

  useEffect(() => {
    if (internalProject.wireframes.length > 0 && activeWireframe === 'none') {
      setActiveWireframe(internalProject.wireframes[0].id);
      setZoom(1);
    }
  }, [internalProject.wireframes, activeWireframe]);

  useEffect(() => {
    if (internalProject.wireframes.length === 0) {
      triggerUnsyncedState();
      const { width, height } = getDimensionsForResolution(internalProject.resolution, internalProject.width, internalProject.height);
      const firstWireframe: Wireframe = {
        id: Date.now().toString(),
        name: 'Tela 1',
        elements: [],
        width,
        height,
      };

      const updatedProject = {
        ...internalProject,
        wireframes: [firstWireframe]
      };
      
      updateAndSaveProject(updatedProject);
      setActiveWireframe(firstWireframe.id);
    }
  }, [internalProject, activeWireframe]);

  useEffect(() => {
    if (selectedElement) {
      setSidebarTab('properties');
    }
  }, [selectedElement]);

  useLayoutEffect(() => {
    const container = canvasContainerRef.current;
    if (container && scrollPos.current.shouldUpdate) {
      container.scrollLeft = scrollPos.current.left;
      container.scrollTop = scrollPos.current.top;
      scrollPos.current.shouldUpdate = false;
    }
  }, [selectedElement]);

  const selectedElementData = selectedElement && currentWireframe?.elements.find(el => el.id === selectedElement);

  useEffect(() => {
    if (selectedElementData && selectedElementData.type === 'frame' && selectedElementData.layoutMode !== 'none') {
      updateFrameLayout(selectedElementData.id);
    }
  }, [selectedElementData?.layoutMode, selectedElementData?.padding, selectedElementData?.itemSpacing, updateFrameLayout]);

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
          case 'ArrowUp': moveElementWithKeyboard('up', step); break;
          case 'ArrowDown': moveElementWithKeyboard('down', step); break;
          case 'ArrowLeft': moveElementWithKeyboard('left', step); break;
          case 'ArrowRight': moveElementWithKeyboard('right', step); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [selectedElement, copiedElement, currentWireframe, activeWireframe, canvasDimensions, setZoom]);

  useLayoutEffect(() => {
    if (scrollTarget.current.apply) {
      const container = canvasContainerRef.current;
      if (container) {
        container.scrollLeft = scrollTarget.current.left;
        container.scrollTop = scrollTarget.current.top;
      }
      scrollTarget.current.apply = false;
    }
  }, [zoom]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const rect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setZoom(oldZoom => {
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          const newZoom = Math.max(0.1, Math.min(3, oldZoom + delta));

          const contentWidth = canvasDimensions.width * oldZoom;
          const containerWidth = container.clientWidth;
          const offsetX = Math.max(0, (containerWidth - contentWidth) / 2);

          const contentHeight = canvasDimensions.height * oldZoom;
          const containerHeight = container.clientHeight;
          const offsetY = Math.max(0, (containerHeight - contentHeight) / 2);

          const mouseContentX = (scrollLeft + mouseX - offsetX) / oldZoom;
          const mouseContentY = (scrollTop + mouseY - offsetY) / oldZoom;

          const newContentWidth = canvasDimensions.width * newZoom;
          const newOffsetX = Math.max(0, (containerWidth - newContentWidth) / 2);

          const newContentHeight = canvasDimensions.height * newZoom;
          const newOffsetY = Math.max(0, (containerHeight - newContentHeight) / 2);

          scrollTarget.current = {
            left: mouseContentX * newZoom - mouseX + newOffsetX,
            top: mouseContentY * newZoom - mouseY + newOffsetY,
            apply: true
          };

          return newZoom;
        });
      } else {
        const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = container;

        if (e.deltaY < 0 && scrollTop === 0) {
          e.preventDefault();
        }
        if (e.deltaY > 0 && Math.abs(scrollHeight - clientHeight - scrollTop) < 1) {
          e.preventDefault();
        }
        if (e.deltaX < 0 && scrollLeft === 0) {
          e.preventDefault();
        }
        if (e.deltaX > 0 && Math.abs(scrollWidth - clientWidth - scrollLeft) < 1) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [setZoom, canvasDimensions]);

  const handleToolDragStart = (e: React.DragEvent, toolType: string) => {
    e.stopPropagation();
    setDraggedTool(toolType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', toolType);
    e.dataTransfer.setData('application/x-wireframe-tool', toolType);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    const hasIcon = e.dataTransfer.types.includes('application/json');
    const hasTool = e.dataTransfer.types.includes('application/x-wireframe-tool') || e.dataTransfer.types.includes('text/plain');
    
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
    if (!stage) return;

    const stageContainer = stage.container();
    const stageRect = stageContainer.getBoundingClientRect();

    const x = (e.clientX - stageRect.left) / zoom;
    const y = (e.clientY - stageRect.top) / zoom;
    
    let iconData = null;
    try {
      const transferData = e.dataTransfer.getData('application/json');
      if (transferData) iconData = JSON.parse(transferData);
    } catch (error) {}
    
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
        ...internalProject,
        wireframes: internalProject.wireframes.map(w => 
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
      toolType = e.dataTransfer.getData('application/x-wireframe-tool') || e.dataTransfer.getData('text/plain');
    }
    
    if (!toolType) return;
    
    const getMinimumSize = (type: string) => {
      switch (type) {
        case 'text': return { width: 100, height: 30 };
        case 'button': return { width: 80, height: 35 };
        case 'image': 
        case 'video': return { width: 120, height: 80 };
        case 'icon': return { width: Math.max(24, 40), height: Math.max(24, 40) };
        case 'line': return { width: 100, height: 2 };
        case 'circle': return { width: 60, height: 60 };
        case 'frame': return { width: 200, height: 150 };
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
      borderWidth: toolType === 'text' ? 0 : toolType === 'frame' ? 2 : 2,
      borderColor: toolType === 'frame' ? 'lightblue' : '#d1d5db',
      imageSrc: toolType === 'image' ? imageplaceholder : undefined,
      videoSrc: toolType === 'video' ? videoplaceholder : undefined,
      iconName: toolType === 'icon' ? 'Star' : undefined,
      grayscale: (toolType === 'image' || toolType === 'video') ? 1 : undefined,
    };

    const updatedProject = {
      ...internalProject,
      wireframes: internalProject.wireframes.map(w => 
        w.id === activeWireframe 
          ? { ...w, elements: [...w.elements, newElement] }
          : w
      )
    };

    updateAndSaveProject(updatedProject);
    setDraggedTool(null);
    setSelectedElement(newElement.id);
    
    const elementTypeNames = {
      'text': 'Texto', 'button': 'Botão', 'rectangle': 'Retângulo', 'circle': 'Círculo', 'line': 'Linha', 'image': 'Imagem', 'video': 'Vídeo', 'icon': 'Ícone', 'frame': 'Frame'
    };
    
    showToast(`${elementTypeNames[toolType as keyof typeof elementTypeNames] || 'Elemento'} adicionado com sucesso!`, 'success');
  };

  const handleSelectWireframe = (wireframeId: string) => {
    setActiveWireframe(wireframeId);
    setZoom(1);
  };

  const handleAddWireframe = () => {
    if (!newWireframeName.trim()) return;
    triggerUnsyncedState();
    const { width, height } = getDimensionsForResolution(internalProject.resolution, internalProject.width, internalProject.height);
    const newWireframe: Wireframe = {
      id: Date.now().toString(),
      name: newWireframeName.trim(),
      elements: [],
      width,
      height,
    };

    const updatedProject = {
      ...internalProject,
      wireframes: [...internalProject.wireframes, newWireframe]
    };

    updateAndSaveProject(updatedProject);
    setActiveWireframe(newWireframe.id);
    setIsAddWireframeOpen(false);
    setNewWireframeName('');
    showToast('Nova tela criada com sucesso!', 'success');
  };

  const handleUpdateWireframe = (wireframeId: string, updates: Partial<Wireframe>) => {
    triggerUnsyncedState();
    const updatedProject = {
      ...internalProject,
      wireframes: internalProject.wireframes.map(w =>
        w.id === wireframeId ? { ...w, ...updates } : w
      )
    };
    updateAndSaveProject(updatedProject);
  };

  const handleDeleteWireframe = (wireframeId: string) => {
    if (internalProject.wireframes.length <= 1) {
      showToast('Não é possível excluir a última tela de usuário!', 'error');
      return;
    }
    triggerUnsyncedState();
    const updatedProject = {
      ...internalProject,
      wireframes: internalProject.wireframes.filter(w => w.id !== wireframeId)
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
      ...internalProject,
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
    };

    const updatedProject = {
      ...internalProject,
      wireframes: internalProject.wireframes.map(w =>
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
        ...internalProject,
        wireframes: internalProject.wireframes.map(w => 
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
      case 'up': newY = Math.max(0, element.y - step); break;
      case 'down': newY = Math.min(canvasDimensions.height - element.height, element.y + step); break;
      case 'left': newX = Math.max(0, element.x - step); break;
      case 'right': newX = Math.min(canvasDimensions.width - element.width, element.x + step); break;
    }

    const updatedProject = {
      ...internalProject,
      wireframes: internalProject.wireframes.map(w => 
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
      ...internalProject,
      wireframes: internalProject.wireframes.map(w => 
        w.id === activeWireframe 
          ? { ...w, elements: w.elements.filter(el => el.id !== selectedElement) }
          : w
      )
    };

    updateAndSaveProject(updatedProject);
    setSelectedElement(null);
    showToast('Elemento excluído!', 'success');
  };

  const handleCanvasMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      if (!canvasContainerRef.current) return;
      
      setSelectedElement(null);
      const container = canvasContainerRef.current;
      container.style.userSelect = 'none';

      const startX = e.evt.pageX - container.scrollLeft;
      const startY = e.evt.pageY - container.scrollTop;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        container.scrollLeft = moveEvent.pageX - startX;
        container.scrollTop = moveEvent.pageY - startY;
      };

      const handleMouseUp = () => {
        container.style.userSelect = 'auto';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

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
                ...internalProject,
                wireframes: internalProject.wireframes.map(w =>
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
  }, [internalProject, activeWireframe, showToast, stageRef, canvasDimensions, setSelectedElement, currentWireframe]);

  const handleElementMouseDown = useCallback((elementId: string) => {
    const container = canvasContainerRef.current;
    if (container) {
      scrollPos.current = { left: container.scrollLeft, top: container.scrollTop, shouldUpdate: true };
    }
    setSelectedElement(elementId);
  }, []);

  const handleElementDragEnd = useCallback((elementId: string, newX: number, newY: number) => {
    if (!currentWireframe) return;
    const element = currentWireframe.elements.find(el => el.id === elementId);
    if (!element) return;

    const clampedX = Math.max(0, Math.min(newX, canvasDimensions.width - element.width));
    const clampedY = Math.max(0, Math.min(newY, canvasDimensions.height - element.height));

    const frames = currentWireframe.elements.filter(el => el.type === 'frame' && el.id !== elementId);
    let newParent: WireframeElement | undefined = undefined;

    const elementCenterX = clampedX + element.width / 2;
    const elementCenterY = clampedY + element.height / 2;

    for (const frame of frames) {
      if (
        elementCenterX >= frame.x && elementCenterX < frame.x + frame.width &&
        elementCenterY >= frame.y && elementCenterY < frame.y + frame.height
      ) {
        if (!newParent || (frame.zIndex || 0) > (newParent.zIndex || 0)) {
          newParent = frame;
        }
      }
    }

    const updates: Partial<WireframeElement> = { x: clampedX, y: clampedY, parentId: newParent?.id };

    if (newParent) {
      updates.x = clampedX - newParent.x;
      updates.y = clampedY - newParent.y;
    }

    updateElementProperties(elementId, updates);
}, [updateElementProperties, currentWireframe, canvasDimensions]);

  const handleReparentElement = useCallback((elementId: string, newParentId: string | null, newX: number, newY: number) => {
    updateElementProperties(elementId, { x: newX, y: newY, parentId: newParentId === null ? undefined : newParentId });
  }, [updateElementProperties]);

  const handleElementTransformEnd = useCallback((elementId: string, newX: number, newY: number, newWidth: number, newHeight: number) => {
    const element = currentWireframe?.elements.find(el => el.id === elementId);
    if (!element) return;

    const parentFrame = element.parentId ? currentWireframe?.elements.find(el => el.id === element.parentId) : null;

    const minSize = getElementMinimumSize(element.type);
    const finalWidth = Math.max(minSize, newWidth);
    const finalHeight = Math.max(minSize, newHeight);
    let finalX, finalY;

    if (parentFrame) {
        // Assume newX/newY are absolute, convert to relative to the parent frame.
        const relativeX = newX - parentFrame.x;
        const relativeY = newY - parentFrame.y;

        // Clamp position to keep the element within the parent's bounds.
        finalX = Math.max(0, Math.min(relativeX, parentFrame.width - finalWidth));
        finalY = Math.max(0, Math.min(relativeY, parentFrame.height - finalHeight));
    } else {
        // No parent, clamp to canvas boundaries.
        finalX = Math.max(0, Math.min(newX, canvasDimensions.width - finalWidth));
        finalY = Math.max(0, Math.min(newY, canvasDimensions.height - finalHeight));
    }

    updateElementProperties(elementId, {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
    });

    if (parentFrame && parentFrame.layoutMode && parentFrame.layoutMode !== 'none') {
      setTimeout(() => {
        updateFrameLayout(parentFrame.id);
      }, 0);
    }
  }, [updateElementProperties, currentWireframe, canvasDimensions, getElementMinimumSize, updateFrameLayout]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedElement) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageSrc = event.target?.result as string;
        if (imageSrc) {
          updateElementProperty(selectedElement, 'imageSrc', imageSrc);
          showToast('Imagem atualizada com sucesso!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
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
      link.download = `${currentWireframe.name.replace(/\s/g, '_')}_${internalProject.resolution}.svg`;
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

    const handlePublish = (selectedWireframeIds: string[]) => {
    // TODO: Implement the actual publish logic
    console.log('Publishing wireframes:', selectedWireframeIds);
    showToast(`${selectedWireframeIds.length} telas publicadas com sucesso!`, 'success');
  };

  const handleFetchFigmaData = async (url: string, token: string) => {
    showToast('Importando do Figma...', 'info');

    const fileKey = url.match(/(?:file|design)\/([^\/]+)/)?.[1];
    if (!fileKey) {
      throw new Error('URL do Figma inválida.');
    }

    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`,
      {
        headers: {
          'X-Figma-Token': token,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data: FigmaFile = await response.json();

    const imageFills = new Map<string, string>();
    const nodesWithImageFills = new Set<string>();

    function findImageFills(node: any) {
      if (node.fills) {
        for (const fill of node.fills) {
          if (fill.type === 'IMAGE' && fill.imageRef) {
            nodesWithImageFills.add(node.id);
            imageFills.set(fill.imageRef, node.id);
          }
        }
      }
      if (node.children) {
        for (const child of node.children) {
          findImageFills(child);
        }
      }
    }

    findImageFills(data.document);

    let imageUrls: { [key: string]: string } = {};
    if (nodesWithImageFills.size > 0) {
      const imageResponse = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${Array.from(nodesWithImageFills).join(',')}`,
        {
          headers: {
            'X-Figma-Token': token,
          },
        }
      );
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageUrls = imageData.images;
      }
    }

    const svgNodeIds = new Set<string>();
    function findSvgNodes(node: any) {
      if (['VECTOR', 'COMPONENT', 'INSTANCE'].includes(node.type)) {
        const isIcon = node.name.toLowerCase().includes('icon');
        if (!isIcon) {
          svgNodeIds.add(node.id);
        }
      }
      if (node.children) {
        for (const child of node.children) {
          findSvgNodes(child);
        }
      }
    }

    findSvgNodes(data.document);

    let svgUrls: { [key: string]: string } = {};
    if (svgNodeIds.size > 0) {
      const svgResponse = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${Array.from(svgNodeIds).join(',')}&format=svg`,
        {
          headers: {
            'X-Figma-Token': token,
          },
        }
      );
      if (svgResponse.ok) {
        const svgData = await svgResponse.json();
        svgUrls = svgData.images;
      }
    }

    return convertFigmaToWireframes(data, imageUrls, svgUrls);
  };

  const handleConfirmFigmaImport = (importData: any) => {
    const { wireframes: newWireframes, links: newLinks } = importData;

    if (newWireframes.length === 0) {
      showToast('Nenhuma tela (frame) encontrada no arquivo Figma.', 'warning');
      return;
    }

    const wireframesWithNavigation = newWireframes.map((wireframe: any) => {
        const elementsWithNavigation = wireframe.elements.map((element: any) => {
            const link = newLinks.find((l: any) => l.sourceId === element.id);
            if (link) {
                return { ...element, navigationTarget: link.destinationId };
            }
            return element;
        });
        return { ...wireframe, elements: elementsWithNavigation };
    });

    const firstFrame = wireframesWithNavigation[0];
    const updatedProject = {
      ...internalProject,
      resolution: 'custom' as const,
      width: firstFrame.width,
      height: firstFrame.height,
      wireframes: [...internalProject.wireframes, ...wireframesWithNavigation],
    };

    updateAndSaveProject(updatedProject);
    
    if (newWireframes.length > 0) {
      
    }

    showToast(`${newWireframes.length} tela(s) importada(s) com sucesso!`, 'success');
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
          svgElements.push({ id, type: 'line', x, y, width, height, textColor: fill, borderWidth: 0 });
        } else {
          svgElements.push({ id, type: 'rectangle', x, y, width, height, backgroundColor: fill, borderColor: stroke, borderWidth, borderTopLeftRadius: rx, borderTopRightRadius: rx, borderBottomLeftRadius: rx, borderBottomRightRadius: rx });
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

        svgElements.push({ id, type: 'circle', x: cx - r, y: cy - r, width: r * 2, height: r * 2, backgroundColor: fill, borderColor: stroke, borderWidth });
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

        svgElements.push({ id, type: 'text', x: textAnchor === 'middle' ? x - estimatedWidth / 2 : x, y: y - fontSize / 2, width: estimatedWidth, height: estimatedHeight, text: textContent, textColor, textAlign: textAnchor === 'middle' ? 'center' : textAnchor === 'end' ? 'right' : 'left', textLevel: 'p' });
      });

      svgDoc.querySelectorAll('image').forEach(image => {
        const id = uuidv4();
        const x = parseFloat(image.getAttribute('x') || '0');
        const y = parseFloat(image.getAttribute('y') || '0');
        const width = parseFloat(image.getAttribute('width') || '0');
        const height = parseFloat(image.getAttribute('height') || '0');
        const href = image.getAttribute('href') || '';

        svgElements.push({ id, type: 'image', x, y, width, height, imageSrc: href });
      });

      const newWireframe: Wireframe = {
        id: uuidv4(),
        name: importedWireframeData.name,
        elements: svgElements,
      };

      const updatedProject = {
        ...internalProject,
        wireframes: [...internalProject.wireframes, newWireframe],
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
    return (
      <div className="flex items-center justify-center h-full">
        <Flex align="center" gap="middle" vertical>
          <Spin size="large" />
          <p>Carregando...</p>
        </Flex>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      <div ref={topBarRef} className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
           
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsFigmaImportModalOpen(true)}>
            Importar do Figma
          </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadWireframe}>
            Baixar Wireframe
          </Button>
           <Dialog open={isAddWireframeOpen} onOpenChange={setIsAddWireframeOpen}>
              <DialogTrigger asChild>
                <Button variant="" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tela 
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
          <div className="relative flex items-center">
  <Button
    size="sm"
    onClick={handleSaveProject}
    disabled={saveStatus === 'Salvando...'}
    className={`flex items-center gap-2 transition-all ${
      saveStatus === 'Atualizar'
        ? 'bg-blue-500 hover:bg-blue-600 text-white'
        : saveStatus === 'Salvando...'
        ? 'bg-gray-800 hover:bg-gray-700 text-white'
        : saveStatus === 'Erro ao salvar'
        ? 'bg-red-500 hover:bg-red-600 text-white'
        : saveStatus === 'Atualizado'
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : 'bg-gray-800 hover:bg-gray-700 text-white'
    }`}
  >
    {/* Ícones dinâmicos */}
    {saveStatus === 'Salvando...' && <Loader2 className="w-4 h-4 animate-spin" />}
    {saveStatus === 'Atualizar' && <Save className="w-4 h-4" />}
    {saveStatus === 'Erro ao salvar' && <AlertCircle className="w-4 h-4" />}
    {saveStatus === 'Atualizado' && <AlertCircle className="w-4 h-4" />}

    {/* Texto dinâmico */}
    {saveStatus === 'Atualizar'
      ? 'Salvar'
      : saveStatus === 'Salvando...'
      ? 'Salvando...'
      : saveStatus === 'Erro ao salvar'
      ? 'Erro'
      : saveStatus === 'Atualizado'
      ? 'Atualizado'
      : saveStatus}
  </Button>
</div>
       
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <ResizablePanelGroup direction="horizontal">
          {activeMockup === null && !isLeftSidebarCollapsed && (
            <>
              <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
                <div className="border-r border-border bg-card p-0" style={{ height: windowHeight - topBarHeight, overflowY: 'auto' }}>
                  <ElementTree
                    wireframes={internalProject.wireframes}
                    activeWireframe={activeWireframe}
                    selectedElement={selectedElement}
                    onSelectWireframe={handleSelectWireframe}
                    onSelectElement={setSelectedElement}
                    onUpdateWireframe={handleUpdateWireframe}
                    onUpdateElement={updateElementProperty}
                    onDeleteWireframe={handleDeleteWireframe}
                    onDeleteElement={handleDeleteSelectedElement}
                    onReparentElement={handleReparentElement}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          <ResizablePanel defaultSize={activeMockup !== null ? 100 : (isLeftSidebarCollapsed && isRightSidebarCollapsed ? 100 : (isLeftSidebarCollapsed || isRightSidebarCollapsed ? 82 : 64))} minSize={40} className="relative">
            {activeMockup === null && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute z-10 h-16 "
                  onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
                  style={{ top: '42px', left:"8px", height:"48px", width:"48px" }}
                >
                  <ChevronLeft className={`h-4 w-4 transition-transform ${isLeftSidebarCollapsed ? 'rotate-180' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-0 z-10 h-16 rounded-l-md -mr-0.5"
                  onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                   style={{ top: '42px', right:"8px", height:"48px", width:"48px" }}
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${isRightSidebarCollapsed ? 'rotate-180' : ''}`} />
                </Button>
              </>
            )}
          
            {activeMockup !== null ? (
              <MockupView 
                project={internalProject} 
                activeWireframeId={activeWireframe} 
                activeMockup={activeMockup}
              />
            ) : (
              <div
                ref={canvasContainerRef}
                tabIndex={0}
                onMouseEnter={() => (isPointerInsideRef.current = true)}
                onMouseLeave={() => (isPointerInsideRef.current = false)}
                onFocus={() => (isPointerInsideRef.current = true)}
                onBlur={() => (isPointerInsideRef.current = false)}
                style={{ height: windowHeight - topBarHeight, overflowY: 'auto', touchAction: 'none', cursor: 'default', paddingTop: '50px', paddingBottom:'50px' }}
                className="w-full bg-gray-50"
                onDragOver={handleCanvasDragOver}
                onDragLeave={handleCanvasDragLeave}
                onDrop={handleCanvasDrop}
                onPaste={handleCanvasPaste}
              >
                <div className="flex justify-center w-full">
                  <div
                    style={{
                      width: canvasDimensions.width * zoom,
                      height: canvasDimensions.height * zoom,
                    }}
                  >
                    <div
                      className={`relative bg-white shadow-lg ${isDragOverCanvas ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                      style={{
                        width: canvasDimensions.width,
                        height: canvasDimensions.height,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                      }}
                      data-canvas-background="true"
                    >
                      <WireframeCanvas
                        ref={stageRef}
                        project={internalProject}
                        wireframe={currentWireframe}
                        zoom={1}
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
                        isReadOnly={false}
                        isXRayMode={isXRayMode}
                      />
                      <GridOverlay gridConfig={gridConfig} width={canvasDimensions.width} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ResizablePanel>

          {activeMockup === null && !isRightSidebarCollapsed && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
                <div className="border-l border-border bg-card">
                  <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as 'components' | 'properties')} className="h-full flex flex-col" style={{ height: windowHeight - topBarHeight }}>
                    <TabsList className="w-full flex-shrink-0">
                      <TabsTrigger value="components" className="flex-1">Componentes</TabsTrigger>
                      <TabsTrigger value="properties" className="flex-1">Propriedades</TabsTrigger>
                    </TabsList>

                    <TabsContent value="components" className="flex-1 p-4 space-y-6 overflow-y-auto">
                      <div>
                        <Label className="text-sm font-medium">Ferramentas de Desenho</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1" onDragStart={(e) => handleToolDragStart(e, 'rectangle')} onDragEnd={handleDragEnd} draggable>
                            <Square className="w-4 h-4" />
                            <span className="text-xs">Retângulo</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1" onDragStart={(e) => handleToolDragStart(e, 'circle')} onDragEnd={handleDragEnd} draggable>
                            <Circle className="w-4 h-4" />
                            <span className="text-xs">Círculo</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1" onDragStart={(e) => handleToolDragStart(e, 'line')} onDragEnd={handleDragEnd} draggable>
                            <Minus className="w-4 h-4" />
                            <span className="text-xs">Linha</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1" onDragStart={(e) => handleToolDragStart(e, 'frame')} onDragEnd={handleDragEnd} draggable>
                            <Square className="w-4 h-4" />
                            <span className="text-xs">Frame</span>
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Elementos UI</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1" onDragStart={(e) => handleToolDragStart(e, 'text')} onDragEnd={handleDragEnd} draggable>
                            <Type className="w-4 h-4" />
                            <span className="text-xs">Texto</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1" onDragStart={(e) => handleToolDragStart(e, 'button')} onDragEnd={handleDragEnd} draggable>
                            <MousePointer className="w-4 h-4" />
                            <span className="text-xs">Botão</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1" onDragStart={(e) => handleToolDragStart(e, 'image')} onDragEnd={handleDragEnd} draggable>
                            <Image className="w-4 h-4" />
                            <span className="text-xs">Imagem</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1" onDragStart={(e) => handleToolDragStart(e, 'video')} onDragEnd={handleDragEnd} draggable>
                            <Video className="w-4 h-4" />
                            <span className="text-xs">Vídeo</span>
                          </Button>
                        </div>
                      </div>

                      <IconLibrary onSelectIcon={(iconName, iconComponent) => addIconFromLibrary(iconName)} />

                      <div>
                        <Label className="text-sm font-medium">Configurações do Grid</Label>
                        <div className="mt-2">
                          <GridSettings config={gridConfig} onChange={handleGridConfigChange} />
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

                          <DimensionEditor element={selectedElementData} onChange={(property, value) => updateElementProperty(selectedElementData.id, property, value)} canvasDimensions={canvasDimensions} resolution={internalProject.resolution} />

                          {selectedElementData.type === 'image' && (
                            <>
                              <div>
                                <Label htmlFor="element-image">Imagem</Label>
                                <Input id="element-image" type="file" accept="image/*" onChange={handleImageUpload} />
                              </div>
                              <div>
                                <Label>Preto e Branco</Label>
                                <Slider
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  value={[selectedElementData.grayscale ?? 1]}
                                  onValueChange={(value) => updateElementProperties(selectedElementData.id, 'grayscale', value[0])}
                                />
                              </div>
                            </>
                          )}

                          {selectedElementData.type === 'video' && (
                            <div>
                              <Label>Preto e Branco</Label>
                              <Slider
                                min={0}
                                max={1}
                                step={0.1}
                                value={[selectedElementData.grayscale ?? 1]}
                                onValueChange={(value) => updateElementProperties(selectedElementData.id, 'grayscale', value[0])}
                              />
                            </div>
                          )}

                          {selectedElementData.type === 'text' && (
                            <div className="pt-2">
                              <Button onClick={() => setIsTextEditorOpen(true)} className="w-full flex items-center gap-2" variant="outline">
                                <Edit3 className="w-4 h-4" />
                                Editor Inteligente
                              </Button>
                            </div>
                          )}

                          {(selectedElementData.type === 'text' || selectedElementData.type === 'button') && (
                            <>
                              <div>
                                <Label htmlFor="element-text">Texto</Label>
                                <Input id="element-text" value={selectedElementData.text || ''} onChange={(e) => updateElementProperty(selectedElementData.id, 'text', e.target.value)} />
                              </div>

                              <FontLevelPicker value={selectedElementData.textLevel || 'p'} onChange={(value) => updateElementProperty(selectedElementData.id, 'textLevel', value)} resolution={internalProject.resolution} />

                              <TextColorPicker value={selectedElementData.textColor || 'var(--foreground)'} onChange={(value) => updateElementProperty(selectedElementData.id, 'textColor', value)} />

                              <TextAlignPicker value={selectedElementData.textAlign || 'left'} onChange={(value) => updateElementProperty(selectedElementData.id, 'textAlign', value)} />
                            </>
                          )}

                          <div>
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <ArrowRight className="w-4 h-4" />
                              Navegação
                            </Label>
                            <Select value={selectedElementData.navigationTarget || ''} onValueChange={(value) => updateElementProperty(selectedElementData.id, 'navigationTarget', value)}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Selecione a tela de destino" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhuma navegação</SelectItem>
                                {internalProject.wireframes.filter(w => w.id !== activeWireframe).map(wireframe => (
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

                          {selectedElementData.type !== 'text' && selectedElementData.type !== 'line' && (
                            <ColorPicker label="Cor de Fundo" value={selectedElementData.backgroundColor || '#ffffff'} onChange={(value) => updateElementProperties(selectedElementData.id, 'backgroundColor', value)} />
                          )}

                          {selectedElementData.type !== 'text' && selectedElementData.type !== 'line' && (
                            <>
                              <BorderWidthPicker value={selectedElementData.borderWidth || 0} onChange={(value) => updateElementProperty(selectedElementData.id, 'borderWidth', value)} />
                              <BorderColorPicker value={selectedElementData.borderColor || '#d1d5db'} onChange={(value) => updateElementProperty(selectedElementData.id, 'borderColor', value)} />
                            </>
                          )}

                          {(selectedElementData.type === 'rectangle' || selectedElementData.type === 'button' || selectedElementData.type === 'frame') && (
                            <BorderRadiusPicker
                              topLeft={selectedElementData.borderTopLeftRadius || 0}
                              topRight={selectedElementData.borderTopRightRadius || 0}
                              bottomLeft={selectedElementData.borderBottomLeftRadius || 0}
                              bottomRight={selectedElementData.borderBottomRightRadius || 0}
                              onChange={(corner, value) => {
                                const propertyName = `border${corner.charAt(0).toUpperCase() + corner.slice(1)}Radius`;
                                updateElementProperties(selectedElementData.id, propertyName, value);
                              }}
                              elementId={selectedElementData.id}
                            />
                          )}

                          {selectedElementData.type === 'frame' && (
                            <>
                              <div className="space-y-2 pt-4">
                                <Label className="text-sm font-medium">Auto Layout</Label>
                                <Select
                                  value={selectedElementData.layoutMode || 'none'}
                                  onValueChange={(value) => updateElementProperty(selectedElementData.id, 'layoutMode', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select layout mode" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="horizontal">Horizontal</SelectItem>
                                    <SelectItem value="vertical">Vertical</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {(selectedElementData.layoutMode === 'horizontal' || selectedElementData.layoutMode === 'vertical') && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="frame-padding">Padding</Label>
                                    <Input
                                      id="frame-padding"
                                      type="number"
                                      value={selectedElementData.padding || 0}
                                      onChange={(e) => updateElementProperty(selectedElementData.id, 'padding', parseInt(e.target.value, 10) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="frame-spacing">Spacing</Label>
                                    <Input
                                      id="frame-spacing"
                                      type="number"
                                      value={selectedElementData.itemSpacing || 0}
                                      onChange={(e) => updateElementProperty(selectedElementData.id, 'itemSpacing', parseInt(e.target.value, 10) || 0)}
                                    />
                                  </div>
                                </>
                              )}
                            </>
                          )}

                          {selectedElementData.type === 'icon' && (
                            <div>
                              <Label className="text-sm font-medium">Escolher Ícone</Label>
                              <div className="mt-2">
                                <IconLibrary onSelectIcon={(iconName, iconComponent) => { 
                                  updateElementProperties(selectedElementData.id, {
                                    iconName: iconName,
                                    iconComponent: undefined,
                                    iconId: undefined
                                  }); 
                                }} />
                              </div>
                            </div>
                          )}

                          <div>
                            <Label className="text-sm font-medium">Camada</Label>
                            <div className="flex gap-2 mt-2">
                              <Button variant="outline" size="sm" onClick={() => updateElementProperty(selectedElementData.id, 'zIndex', Math.max(0, (selectedElementData.zIndex || 0) - 1))} title="Enviar para trás">
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => updateElementProperty(selectedElementData.id, 'zIndex', (selectedElementData.zIndex || 0) + 1)} title="Trazer para frente">
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="pt-4">
                            <Button variant="destructive" size="sm" onClick={handleDeleteSelectedElement} className="w-full">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir Elemento
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Dimensões da Tela</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <Label htmlFor="wireframe-width">Largura</Label>
                                <Input
                                  id="wireframe-width"
                                  type="number"
                                  value={canvasDimensions.width}
                                  onChange={(e) => handleUpdateWireframe(activeWireframe, { width: parseInt(e.target.value, 10) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="wireframe-height">Altura</Label>
                                <Input
                                  id="wireframe-height"
                                  type="number"
                                  value={canvasDimensions.height}
                                  onChange={(e) => handleUpdateWireframe(activeWireframe, { height: parseInt(e.target.value, 10) || 0 })}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-4">
                            <Switch
                              id="xray-mode"
                              checked={isXRayMode}
                              onCheckedChange={setIsXRayMode}
                            />
                            <Label htmlFor="xray-mode">Raio X</Label>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <TextEditor isOpen={isTextEditorOpen} onClose={() => setIsTextEditorOpen(false)} element={selectedElementData || null} onApplyChanges={handleApplyTextChanges} />

      <LibraryModal isOpen={isLibraryModalOpen} onClose={() => setIsLibraryModalOpen(false)} onImportWireframe={handleImportWireframe} />

      <FigmaImportModal
        isOpen={isFigmaImportModalOpen}
        onClose={() => setIsFigmaImportModalOpen(false)}
        fetchFigmaData={handleFetchFigmaData}
        onImport={handleConfirmFigmaImport}
      />
      <PublishModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} wireframes={internalProject.wireframes} onPublish={handlePublish} />
    </div>
  );
}
