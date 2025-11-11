import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from './ui/drawer';
import { supabase } from '../utils/supabase/client';
import { useToast } from './ToastProvider';
import { Loader2 } from 'lucide-react';
import { WireframeElement, User } from '../types';

interface CreateComponentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  elementData: WireframeElement | null;
  user: User | null;
  publishedComponent?: any | null;
  onComponentCreated: (component: any) => void;
  onComponentUpdated: (component: any) => void;
  onComponentUnpublished: () => void;
}

const buildSerializableElement = (element: WireframeElement): any => {
  const serializable: any = {
    id: element.id,
    type: element.type,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    text: element.text,
    backgroundColor: element.backgroundColor,
    textLevel: element.textLevel,
    textColor: element.textColor,
    textAlign: element.textAlign,
    zIndex: element.zIndex,
    borderWidth: element.borderWidth,
    borderColor: element.borderColor,
    borderTopLeftRadius: element.borderTopLeftRadius,
    borderTopRightRadius: element.borderTopRightRadius,
    borderBottomLeftRadius: element.borderBottomLeftRadius,
    borderBottomRightRadius: element.borderBottomRightRadius,
    iconId: element.iconId,
    iconName: element.iconName,
    iconComponent: element.iconComponent,
    imageSrc: element.imageSrc,
    videoSrc: element.videoSrc,
    navigationTarget: element.navigationTarget,
    name: element.name,
    opacity: element.opacity,
    grayscale: element.grayscale,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    fontFamily: element.fontFamily,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    textAutoResize: element.textAutoResize,
    layoutMode: element.layoutMode,
    padding: element.padding,
    itemSpacing: element.itemSpacing,
    justifyContent: element.justifyContent,
alignItems: element.alignItems,
    sourceComponentId: element.sourceComponentId,
    isComponent: element.isComponent,
  };

  if (element.child && element.child.length > 0) {
    serializable.child = element.child.map(buildSerializableElement);
  }

  Object.keys(serializable).forEach(key => {
    if (serializable[key] === undefined) {
      delete serializable[key];
    }
  });

  return serializable;
};

export function CreateComponentDrawer({
  isOpen,
  onClose,
  elementData,
  user,
  publishedComponent,
  onComponentCreated,
  onComponentUpdated,
  onComponentUnpublished,
}: CreateComponentDrawerProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('web');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [removeConfirmed, setRemoveConfirmed] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (publishedComponent) {
      setName(publishedComponent.nome || publishedComponent.name || '');
      setCategory(publishedComponent.categoria || 'web');
      setDescription(publishedComponent.descricao || '');
      setIsPrivate(!!publishedComponent.privado);
    } else if (elementData) {
      if (elementData.name && String(elementData.name).trim()) {
        setName(String(elementData.name));
      } else if (elementData.text && String(elementData.text).trim()) {
        setName(String(elementData.text));
      } else {
        setName(`${elementData.type} Component`);
      }
    }
  }, [elementData, publishedComponent]);

  const handleCreate = async () => {
    if (!elementData) {
      showToast('Dados do elemento não encontrados.', 'error');
      return;
    }
    if (!user) {
      showToast('Você precisa estar logado para publicar um componente.', 'error');
      return;
    }
    if (!name.trim()) {
      showToast('O nome do componente é obrigatório.', 'error');
      return;
    }

    setIsLoading(true);
    const sanitizedData = buildSerializableElement(elementData);
    const componentToSave = {
      user_id: user.id,
      nome: name,
      categoria: category,
      descricao: description,
      componente_data: sanitizedData,
      privado: isPrivate,
      id_componente: elementData.id,
    };

    try {
      const { data, error } = await supabase.from('biblioteca_componentes').insert([componentToSave]).select().single();
      if (error) throw error;
      onComponentCreated(data);
      showToast('Componente publicado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Error publishing component:', error);
      showToast(`Erro ao publicar componente: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!elementData || !publishedComponent) {
      showToast('Dados do componente não encontrados para atualização.', 'error');
      return;
    }
    if (!name.trim()) {
      showToast('O nome do componente é obrigatório.', 'error');
      return;
    }

    setIsLoading(true);
    const sanitizedData = buildSerializableElement(elementData);
    const componentToUpdate = {
      nome: name,
      categoria: category,
      descricao: description,
      componente_data: sanitizedData,
      privado: isPrivate,
    };

    try {
      const { data, error } = await supabase.from('biblioteca_componentes').update(componentToUpdate).eq('id', publishedComponent.id).select().single();
      if (error) throw error;
      onComponentUpdated(data);
      showToast('Componente atualizado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Error updating component:', error);
      showToast(`Erro ao atualizar componente: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!publishedComponent) {
      showToast('ID do componente não encontrado para remoção.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('biblioteca_componentes').delete().eq('id', publishedComponent.id);
      if (error) throw error;
      showToast('Componente removido da biblioteca.', 'success');
      onComponentUnpublished();
      setRemoveConfirmed(false);
      onClose();
    } catch (err: any) {
      console.error('Erro ao remover componente:', err);
      showToast(`Erro ao remover componente: ${err.message || err}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DrawerContent className="w-1/2 p-4">
        <div className="mx-auto w-full">
          <DrawerHeader>
            <DrawerTitle>{publishedComponent ? 'Editar Componente' : 'Criar Novo Componente'}</DrawerTitle>
            <DrawerDescription>
              {publishedComponent
                ? 'Atualize as informações do seu componente ou remova-o da biblioteca.'
                : 'Salve o elemento selecionado como um componente reutilizável na sua biblioteca.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-0 space-y-4">
            <div>
              <Label htmlFor="comp-name">Nome do Componente</Label>
              <Input id="comp-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="comp-category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="comp-category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comp-desc">Descrição</Label>
              <Textarea id="comp-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o componente, seu uso, etc." />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="comp-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
              <Label htmlFor="comp-private">Privado (visível apenas para você)</Label>
            </div>
          </div>
          <DrawerFooter className="flex-col items-stretch space-y-2">
            {publishedComponent ? (
              <div className="w-full space-y-2">
                <Button onClick={handleUpdate} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Atualizar Componente
                </Button>
                <div className="text-sm text-muted-foreground pt-4">Para remover o componente da biblioteca, confirme abaixo.</div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (!removeConfirmed) {
                        setRemoveConfirmed(true);
                        return;
                      }
                      handleRemove();
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading && removeConfirmed ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {removeConfirmed ? 'Confirmar Remoção' : 'Remover da Biblioteca'}
                  </Button>
                  {removeConfirmed && (
                    <Button variant="outline" onClick={() => setRemoveConfirmed(false)} className="w-36">
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full flex gap-2">
                <Button onClick={handleCreate} disabled={isLoading} className="flex-1">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Publicar Componente
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </div>
            )}
          </DrawerFooter>
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
