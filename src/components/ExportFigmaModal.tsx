import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useToast } from './ToastProvider';
import { WireframeCanvas, WireframeCanvasRef } from './WireframeCanvas';

interface Wireframe {
  id: string;
  name: string;
  elements: any[];
}

interface Project {
  id: string;
  name: string;
  wireframes: Wireframe[];
  resolution: 'mobile' | 'tablet' | 'desktop';
  components: any[];
}

interface ExportFigmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  exportContext: 'editor' | 'dashboard';
}

export function ExportFigmaModal({ isOpen, onClose, project, exportContext }: ExportFigmaModalProps) {
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [exportType, setExportType] = useState<'wireframe' | 'heatmap'>(
    exportContext === 'editor' ? 'wireframe' : 'heatmap'
  );
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const allScreenIds = useMemo(() => project.wireframes.map(w => w.id), [project.wireframes]);

  useEffect(() => {
    // Reset selected screens and export type when modal opens or context changes
    setSelectedScreens([]);
    setExportType(exportContext === 'editor' ? 'wireframe' : 'heatmap');
  }, [isOpen, exportContext]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedScreens(allScreenIds);
    } else {
      setSelectedScreens([]);
    }
  };

  const handleScreenSelect = (screenId: string, checked: boolean) => {
    if (checked) {
      setSelectedScreens(prev => [...prev, screenId]);
    } else {
      setSelectedScreens(prev => prev.filter(id => id !== screenId));
    }
  };

  const handleExport = async () => {
    if (selectedScreens.length === 0) {
      showToast('Por favor, selecione pelo menos uma tela para exportar.', 'warning');
      return;
    }

    setIsExporting(true);
    showToast(`Iniciando exportação de ${selectedScreens.length} tela(s)...`, 'info');

    const zip = new JSZip();
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    try {
      for (const screenId of selectedScreens) {
        const wireframe = project.wireframes.find(w => w.id === screenId);
        if (!wireframe) continue;

        const canvasRef = React.createRef<WireframeCanvasRef>();
        const canvasElement = (
          <WireframeCanvas
            ref={canvasRef}
            project={project}
            wireframe={wireframe}
            zoom={1}
          />
        );

        const root = ReactDOM.createRoot(tempContainer);
        await new Promise<void>(resolve => {
            root.render(canvasElement);
            setTimeout(resolve, 200);
        });

        const stage = canvasRef.current?.getStage();
        if (stage) {
          if (exportType === 'wireframe') {
            const svgData = await stage.toSVG({ convertImagesToDataURI: true });
            zip.file(`${wireframe.name}.svg`, svgData);
          } else { // heatmap
            const dataURL = stage.toDataURL({ pixelRatio: 2 });
            const blob = await (await fetch(dataURL)).blob();
            zip.file(`${wireframe.name}_heatmap.png`, blob);
          }
        }
        root.unmount();
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${project.name}_figma_export.zip`);
      showToast('Exportação concluída com sucesso!', 'success');

    } catch (error) {
      console.error('Failed to export project:', error);
      showToast('Ocorreu um erro durante a exportação.', 'error');
    } finally {
      document.body.removeChild(tempContainer);
      setIsExporting(false);
      onClose();
    }
  };

  const isAllSelected = selectedScreens.length > 0 && selectedScreens.length === allScreenIds.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Exportar para Figma</DialogTitle>
          <DialogDescription>
            Selecione as telas e o formato. Será gerado um .zip com arquivos SVG (editáveis) ou PNG (mapa de calor).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="font-semibold">Telas do Projeto</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                disabled={isExporting}
              />
              <Label htmlFor="select-all">Selecionar Todas</Label>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border p-4 mt-2 space-y-2">
              {project.wireframes.map(wireframe => (
                <div key={wireframe.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={wireframe.id}
                    checked={selectedScreens.includes(wireframe.id)}
                    onCheckedChange={(checked) => handleScreenSelect(wireframe.id, !!checked)}
                    disabled={isExporting}
                  />
                  <Label htmlFor={wireframe.id} className="flex-1">{wireframe.name}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold">Tipo de Exportação</Label>
            <RadioGroup 
              value={exportType} 
              onValueChange={(value: 'wireframe' | 'heatmap') => setExportType(value)}
              disabled={isExporting}
            >
              {exportContext === 'editor' && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wireframe" id="r1" />
                  <Label htmlFor="r1">Apenas Wireframe (SVG editável)</Label>
                </div>
              )}
              {exportContext === 'dashboard' && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="heatmap" id="r2" />
                  <Label htmlFor="r2">Wireframe com Mapa de Calor (PNG estático)</Label>
                </div>
              )}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>Cancelar</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}