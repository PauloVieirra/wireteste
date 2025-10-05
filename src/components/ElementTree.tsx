import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { 
  ChevronDown, 
  ChevronRight, 
  Square, 
  Circle, 
  Type, 
  Image, 
  Video, 
  Minus, 
  Star,
  Trash2,
  Edit3,
  File,
  Folder,
  FolderOpen
} from 'lucide-react';

// Copied from WireframeEditor.tsx - consider moving to a shared types file
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
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  parentId?: string;
  name?: string;
}

interface Wireframe {
  id: string;
  name: string;
  elements: WireframeElement[];
}

interface ElementTreeProps {
  wireframes: Wireframe[];
  activeWireframe: string;
  selectedElement: string | null;
  onSelectWireframe: (wireframeId: string) => void;
  onSelectElement: (elementId: string | null) => void;
  onUpdateWireframe: (wireframeId: string, updates: Partial<Wireframe>) => void;
  onUpdateElement: (elementId: string, updates: Partial<WireframeElement>) => void;
  onDeleteWireframe: (wireframeId: string) => void;
  onDeleteElement: (elementId: string) => void;
  // onMoveElement: (elementId: string, newParentId: string | null, targetWireframeId: string) => void;
}

interface TreeNode {
  element: WireframeElement;
  children: TreeNode[];
}

const truncateName = (name: string, length: number) => {
  if (name.length > length) {
    return name.substring(0, length) + '...';
  }
  return name;
};

const getElementIcon = (type: string) => {
  switch (type) {
    case 'rectangle': case 'button': return Square;
    case 'circle': return Circle;
    case 'text': return Type;
    case 'line': return Minus;
    case 'image': return Image;
    case 'video': return Video;
    case 'icon': return Star;
    default: return File;
  }
};

const getElementName = (element: WireframeElement) => {
  if (element.name && element.name.trim()) return truncateName(element.name, 40);
  if (element.text) return truncateName(element.text, 40);
  return `${element.type}`;
};

export function ElementTree({ 
  wireframes,
  activeWireframe,
  selectedElement, 
  onSelectWireframe,
  onSelectElement, 
  onUpdateWireframe,
  onUpdateElement, 
  onDeleteWireframe,
  onDeleteElement,
  // onMoveElement 
}: ElementTreeProps) {
  const [expandedWireframes, setExpandedWireframes] = useState<Set<string>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [wireframeToDelete, setWireframeToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Automatically expand the active wireframe
    if (activeWireframe && !expandedWireframes.has(activeWireframe)) {
      toggleWireframe(activeWireframe, true);
    }
  }, [activeWireframe]);

  const handleDeleteWireframe = () => {
    if (wireframeToDelete) {
      onDeleteWireframe(wireframeToDelete);
      setWireframeToDelete(null);
    }
  };

  const toggleWireframe = (wireframeId: string, forceOpen = false) => {
    setExpandedWireframes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(wireframeId) && !forceOpen) {
        newExpanded.delete(wireframeId);
      } else {
        newExpanded.add(wireframeId);
      }
      return newExpanded;
    });
  };

  const toggleNode = (elementId: string) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(elementId)) {
        newExpanded.delete(elementId);
      } else {
        newExpanded.add(elementId);
      }
      return newExpanded;
    });
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingValue(currentName);
  };

  const saveEditing = () => {
    if (editingId) {
      const isWireframe = wireframes.some(w => w.id === editingId);
      if (isWireframe) {
        onUpdateWireframe(editingId, { name: editingValue });
      } else {
        onUpdateElement(editingId, { name: editingValue });
      }
      setEditingId(null);
      setEditingValue('');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const buildTree = (elements: WireframeElement[]): TreeNode[] => {
    const elementMap = new Map<string, WireframeElement>();
    elements.forEach(el => elementMap.set(el.id, el));

    const roots: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    elements.forEach(element => {
      nodeMap.set(element.id, { element, children: [] });
    });

    elements.forEach(element => {
      const node = nodeMap.get(element.id)!;
      if (element.parentId && nodeMap.has(element.parentId)) {
        const parent = nodeMap.get(element.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortByZIndex = (nodes: TreeNode[]) => nodes.sort((a, b) => (a.element.zIndex || 0) - (b.element.zIndex || 0));
    const sortRecursive = (nodes: TreeNode[]) => {
      const sorted = sortByZIndex(nodes);
      sorted.forEach(node => { node.children = sortRecursive(node.children); });
      return sorted;
    };

    return sortRecursive(roots);
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const { element } = node;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(element.id);
    const isSelected = selectedElement === element.id;
    const isEditing = editingId === element.id;
    const IconComponent = getElementIcon(element.type);

    return (
      <div key={element.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-accent group ${
            isSelected ? 'bg-primary text-primary-foreground' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (isEditing) return;
            onSelectElement(element.id);
          }}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren && (
              <Button
                variant="ghost" size="sm" className="w-4 h-4 p-0 hover:bg-transparent"
                onClick={(e) => { e.stopPropagation(); toggleNode(element.id); }}
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </Button>
            )}
          </div>

          <IconComponent className="w-3 h-3 mx-2 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing();
                  if (e.key === 'Escape') cancelEditing();
                }}
                onBlur={saveEditing}
                className="h-6 text-xs"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate" title={getElementName(element)}>
                {getElementName(element)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0"
              onClick={(e) => { e.stopPropagation(); startEditing(element.id, getElementName(element)); }}
              title="Renomear"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id); }}
              title="Excluir"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderWireframe = (wireframe: Wireframe) => {
    const isWireframeExpanded = expandedWireframes.has(wireframe.id);
    const isWireframeActive = activeWireframe === wireframe.id;
    const isEditing = editingId === wireframe.id;
    const elementTree = buildTree(wireframe.elements);

    return (
      <div key={wireframe.id} className="select-none">
        <div
          className={`flex items-center py-1 pl-2 pr-1 rounded text-sm cursor-pointer hover:bg-accent group ${
            isWireframeActive ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          onClick={() => {
            if (isEditing) return;
            toggleWireframe(wireframe.id);
            onSelectWireframe(wireframe.id);
            onSelectElement(null);
          }}
        >
          <Button
            variant="ghost" size="sm" className="w-4 h-4 p-0 hover:bg-transparent"
            onClick={(e) => { e.stopPropagation(); toggleWireframe(wireframe.id); }}
          >
            {isWireframeExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
          </Button>

          <div className="flex-1 min-w-0 ml-2">
            {isEditing ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing();
                  if (e.key === 'Escape') cancelEditing();
                }}
                onBlur={saveEditing}
                className="h-6 text-xs"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate font-semibold" title={wireframe.name}>
                {truncateName(wireframe.name, 40)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0"
              onClick={(e) => { e.stopPropagation(); startEditing(wireframe.id, wireframe.name); }}
              title="Renomear Tela"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); setWireframeToDelete(wireframe.id); }}
              title="Excluir Tela"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {isWireframeExpanded && (
          <div className="pl-4 border-l-2 border-dashed border-border ml-4">
            {elementTree.length > 0 ? (
              elementTree.map(node => renderNode(node, 1))
            ) : (
              <div className="text-xs text-muted-foreground p-2 pl-5">Nenhum elemento nesta tela.</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="h-full">
        <div className="p-3 border-b border-border">
          <h3 className="font-medium text-sm">Telas e Elementos</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie suas telas e a hierarquia dos elementos.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {wireframes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma tela criada</p>
                <p className="text-xs">Crie uma nova tela para começar</p>
              </div>
            ) : (
              wireframes.map(renderWireframe)
            )}
          </div>
        </div>
      </div>
      <AlertDialog open={!!wireframeToDelete} onOpenChange={() => setWireframeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a tela e todos os seus elementos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWireframe}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}