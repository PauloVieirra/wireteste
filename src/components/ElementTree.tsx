import React, { useState, useEffect, useRef } from 'react';
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

// Tabs component used elsewhere in the app; adjust path if different
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

// Copied from WireframeEditor.tsx - consider moving to a shared types file
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
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  child?: WireframeElement[];
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
  onUpdateElement: (elementId: string, property: string, value: any) => void;
  onDeleteWireframe: (wireframeId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onReparentElement: (elementId: string, newParentId: string | null, newX: number, newY: number) => void;
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
    case 'frame': return Folder;
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

// getElementName is computed per-component so it can use generatedNames state

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
  onReparentElement
}: ElementTreeProps) {
  const [generatedNames, setGeneratedNames] = useState<Record<string,string>>({});

  useEffect(() => {
    const wf = wireframes.find(w => w.id === activeWireframe);
    if (!wf) {
      setGeneratedNames({});
      return;
    }

    const counters: Record<string, number> = {};
    const map: Record<string, string> = {};

    const traverse = (elements: WireframeElement[]) => {
      for (const el of elements) {
        // determine display name
        let nameToUse: string | null = null;
        if (el.name && el.name.trim()) {
          nameToUse = el.name.trim();
        } else if (el.text && String(el.text).trim()) {
          nameToUse = String(el.text).trim();
        } else {
          const key = el.type || 'element';
          const idx = counters[key] ?? 0;
          nameToUse = `${key}_${idx}`;
          counters[key] = idx + 1;
        }
        map[el.id] = nameToUse;
        if (el.child && el.child.length > 0) traverse(el.child);
      }
    };

    traverse(wf.elements || []);
    setGeneratedNames(map);
  }, [wireframes, activeWireframe]);

  const getElementName = (element: WireframeElement) => {
    if (element.name && element.name.trim()) return truncateName(element.name, 40);
    if (element.text) return truncateName(String(element.text), 40);
    if (generatedNames[element.id]) return truncateName(generatedNames[element.id], 40);
    return `${element.type}`;
  };
  const [expandedWireframes, setExpandedWireframes] = useState<Set<string>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [wireframeToDelete, setWireframeToDelete] = useState<string | null>(null);
  const [leftPanelTab, setLeftPanelTab] = useState<'structure' | 'code'>('structure');
  const [jsonOpenWireframes, setJsonOpenWireframes] = useState<Record<string, boolean>>({});
  
  // DND State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const cleanupDragState = () => {
    setDraggedItemId(null);
    setDropTargetId(null);
  };

  const getDraggedItem = (e: React.DragEvent): WireframeElement | null => {
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to get dragged item:", error);
    }
    return null;
  };

  useEffect(() => {
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
        onUpdateElement(editingId, 'name', editingValue);
      }
      setEditingId(null);
      setEditingValue('');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
  };

  // --- DND Handlers ---
  const handleDragStart = (e: React.DragEvent, element: WireframeElement) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(element));
    setDraggedItemId(element.id);
  };

  const handleDragOver = (e: React.DragEvent, targetElement?: WireframeElement) => {
    e.preventDefault();
    const draggedItem = getDraggedItem(e);
    if (!draggedItem) return;

    if (targetElement) {
      // Can't drop on itself or its own children
      if (draggedItem.id === targetElement.id || isDescendant(targetElement.id, draggedItem.id)) {
        setDropTargetId(null);
        return;
      }
      // Only frames can be drop targets
      if (targetElement.type === 'frame') {
        setDropTargetId(targetElement.id);
      } else {
        setDropTargetId(null);
      }
    } else {
      // Hovering over the root drop zone
      setDropTargetId('root');
    }
  };
  
  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const isDescendant = (potentialChildId: string, parentId: string): boolean => {
      const findElement = (elements: WireframeElement[], id: string): WireframeElement | null => {
          for (const el of elements) {
              if (el.id === id) return el;
              if (el.child) {
                  const found = findElement(el.child, id);
                  if (found) return found;
              }
          }
          return null;
      }
      const parent = findElement(wireframes.find(w => w.id === activeWireframe)?.elements || [], parentId);
      if (!parent) return false;

      const check = (element: WireframeElement): boolean => {
          if (element.id === potentialChildId) return true;
          if (element.child) {
              return element.child.some(c => check(c));
          }
          return false;
      }
      return parent.child ? parent.child.some(c => check(c)) : false;
  }


  const handleDrop = (e: React.DragEvent, dropTarget?: WireframeElement) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedItem = getDraggedItem(e);
    if (!draggedItem) return;

    const findElementWithParent = (elements: WireframeElement[], id: string, parent: WireframeElement | null = null): { element: WireframeElement, parent: WireframeElement | null } | null => {
        for (const el of elements) {
            if (el.id === id) return { element: el, parent };
            if (el.child) {
                const found = findElementWithParent(el.child, id, el);
                if (found) return found;
            }
        }
        return null;
    }
    
    const getElementPath = (elements: WireframeElement[], id: string): WireframeElement[] | null => {
        const find = (currentElements: WireframeElement[], targetId: string, path: WireframeElement[]): WireframeElement[] | null => {
            for (const el of currentElements) {
                const newPath = [...path, el];
                if (el.id === targetId) return newPath;
                if (el.child) {
                    const found = find(el.child, targetId, newPath);
                    if (found) return found;
                }
            }
            return null;
        }
        return find(elements, id, []);
    }

    const getAbsolutePosition = (path: WireframeElement[]): {x: number, y: number} => {
        return path.reduce((pos, el) => ({ x: pos.x + el.x, y: pos.y + el.y }), { x: 0, y: 0 });
    }

    const currentElements = wireframes.find(w => w.id === activeWireframe)?.elements || [];
    const foundOld = findElementWithParent(currentElements, draggedItem.id);
    const oldParent = foundOld ? foundOld.parent : null;

    let newParentId: string | null = null;
    if (dropTarget && dropTarget.type === 'frame' && dropTarget.id !== draggedItem.id) {
      newParentId = dropTarget.id;
    }

    if ((oldParent?.id || null) === newParentId) {
      cleanupDragState();
      return;
    }

    let newX = draggedItem.x;
    let newY = draggedItem.y;

    const oldParentPath = oldParent ? getElementPath(currentElements, oldParent.id) : [];
    const oldParentAbsPos = oldParentPath ? getAbsolutePosition(oldParentPath) : {x: 0, y: 0};
    
    const newParentPath = newParentId ? getElementPath(currentElements, newParentId) : [];
    const newParentAbsPos = newParentPath ? getAbsolutePosition(newParentPath) : {x: 0, y: 0};

    const draggedItemAbsX = oldParentAbsPos.x + draggedItem.x;
    const draggedItemAbsY = oldParentAbsPos.y + draggedItem.y;

    newX = draggedItemAbsX - newParentAbsPos.x;
    newY = draggedItemAbsY - newParentAbsPos.y;
    
    onReparentElement(draggedItem.id, newParentId, newX, newY);
    cleanupDragState();
  };


  const buildTree = (elements: WireframeElement[]): TreeNode[] => {
    const convertToTreeNodes = (els: WireframeElement[]): TreeNode[] => {
        return els.map(el => ({
            element: el,
            children: el.child ? convertToTreeNodes(el.child) : []
        }));
    };

    const sortByZIndex = (nodes: TreeNode[]) => nodes.sort((a, b) => (a.element.zIndex || 0) - (b.element.zIndex || 0));
    const sortRecursive = (nodes: TreeNode[]) => {
      const sorted = sortByZIndex(nodes);
      sorted.forEach(node => { node.children = sortRecursive(node.children); });
      return sorted;
    };

    return sortRecursive(convertToTreeNodes(elements));
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const { element } = node;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(element.id);
    const isSelected = selectedElement === element.id;
    const isEditing = editingId === element.id;
    const isDropTarget = dropTargetId === element.id;
    const isDragged = draggedItemId === element.id;
    const IconComponent = getElementIcon(element.type);

    return (
      <div key={element.id} className="select-none"
        onDragOver={(e) => handleDragOver(e, element)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, element)}
      >
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleDragStart(e, element)}
          onDragEnd={cleanupDragState}
          className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-accent group ${
            isSelected ? 'bg-primary text-primary-foreground' : ''
          } ${isDropTarget ? 'bg-blue-200' : ''} ${isDragged ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (isEditing) return;
            console.log('ElementTree CLICK element:', element.id, 'type:', element.type);
            onSelectElement(element.id);
          }}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren && (
              <Button
                    variant="ghost" size="sm" className="w-4 h-4 p-0 hover:bg-transparent"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleNode(element.id); }}
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
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); startEditing(element.id, getElementName(element)); }}
              title="Renomear"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0 text-destructive hover:text-destructive"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteElement(element.id); }}
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
    const isRootDropTarget = dropTargetId === 'root';

    return (
      <div key={wireframe.id} className="select-none">
        <div
          className={`flex items-center py-1 pl-2 pr-1 rounded text-sm cursor-pointer hover:bg-accent group ${
            isWireframeActive ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          onClick={() => {
            if (isEditing) return;
            console.log('ElementTree CLICK wireframe:', wireframe.id, 'name:', wireframe.name);
            toggleWireframe(wireframe.id);
            onSelectWireframe(wireframe.id);
            onSelectElement(null);
          }}
        >
          <Button
            variant="ghost" size="sm" className="w-4 h-4 p-0 hover:bg-transparent"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleWireframe(wireframe.id); }}
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
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); startEditing(wireframe.id, wireframe.name); }}
              title="Renomear Tela"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0 text-destructive hover:text-destructive"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setWireframeToDelete(wireframe.id); }}
              title="Excluir Tela"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {isWireframeExpanded && (
          <div 
            ref={dropZoneRef}
            onDragOver={(e) => handleDragOver(e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e)}
            className={`pl-4 border-l-2 border-dashed border-border ml-4 ${isRootDropTarget ? 'bg-blue-100' : ''}`}
          >
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

  const JsonCodeView: React.FC<{
  wireframes: Wireframe[];
  activeWireframe: string;
  selectedElement: string | null;
  onSelectWireframe: (id: string) => void;
  onSelectElement: (id: string | null) => void;
}> = ({ wireframes, activeWireframe, selectedElement, onSelectWireframe, onSelectElement }) => {
  const toggle = (id: string) => setJsonOpenWireframes(prev => ({ ...prev, [id]: !prev[id] }));

  const renderNode = (element: WireframeElement, depth = 0, wireframeId?: string) => {
      const isSelected = selectedElement === element.id;
      
      const getSerializableElement = (el: WireframeElement): any => {
        const { ...rest } = el;
        if (rest.child) {
            rest.child = rest.child.map(getSerializableElement);
        }
        return rest;
      }

      return (
        <div key={element.id} style={{ paddingLeft: depth * 12 }}>
          <div
            onClick={(e) => { e.stopPropagation(); if (wireframeId) setJsonOpenWireframes(prev => ({ ...prev, [wireframeId]: true })); onSelectElement(element.id); }}
            className={`cursor-pointer my-2 p-2 rounded border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50 hover:border-border'}`}
          >
            <div className="text-xs text-muted-foreground mb-1">{element.type} — {element.id}</div>
            <pre className="whitespace-pre-wrap text-[12px] font-mono m-0 p-0">{JSON.stringify(getSerializableElement(element), null, 2)}</pre>
          </div>
        </div>
      );
    };

    return (
      <div className="p-3 overflow-y-auto h-full">
        {wireframes.map(w => {
          return (
            <div key={w.id} className="mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => toggle(w.id)}
                  className="text-sm font-medium text-left w-full"
                >
                  {w.name} <span className="text-xs text-muted-foreground">({w.elements.length} itens)</span>
                </button>
              </div>

              {jsonOpenWireframes[w.id] && (
                <div className="mt-2 ml-2">
                  {w.elements.length === 0 && <div className="text-sm text-muted-foreground">Sem elementos</div>}
                  {w.elements.map(node => renderNode(node, 0, w.id))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="h-full flex flex-col">
        

        <div className="flex-1 overflow-hidden">
          <Tabs value={leftPanelTab} onValueChange={(v: string) => setLeftPanelTab(v as 'structure' | 'code')} className="h-full flex flex-col">
            <TabsList className="w-full flex-shrink-0">
              <TabsTrigger value="structure" className="flex-1">Estrutura</TabsTrigger>
              <TabsTrigger value="code" className="flex-1">Código</TabsTrigger>
            </TabsList>

            <TabsContent value="structure" className="h-full overflow-hidden">
              {wireframes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tela criada</p>
                  <p className="text-xs">Crie uma nova tela para começar</p>
                </div>
              ) : (
                <div className="overflow-y-auto h-full p-2">
                  {wireframes.map(renderWireframe)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="h-full overflow-hidden">
              <JsonCodeView wireframes={wireframes} activeWireframe={activeWireframe} selectedElement={selectedElement} onSelectWireframe={onSelectWireframe} onSelectElement={onSelectElement} />
            </TabsContent>
          </Tabs>
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
