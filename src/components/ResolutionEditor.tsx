import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Monitor, Tablet, Smartphone, Settings } from 'lucide-react';
import type { Project } from '../types';
import { useToast } from './ToastProvider';

interface ResolutionEditorProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function ResolutionEditor({ project, onUpdate }: ResolutionEditorProps) {
  const [resolution, setResolution] = useState(project.resolution);
  const [width, setWidth] = useState(project.width ? String(project.width) : '');
  const [height, setHeight] = useState(project.height ? String(project.height) : '');
  const [originalResolution, setOriginalResolution] = useState(project.resolution);

  const { showToast } = useToast();

  useEffect(() => {
    setResolution(project.resolution);
    setWidth(project.width ? String(project.width) : '');
    setHeight(project.height ? String(project.height) : '');
    setOriginalResolution(project.resolution);
  }, [project]);

  const handleResolutionChange = (value: 'mobile' | 'tablet' | 'desktop' | 'custom') => {
    setResolution(value);
    if (value !== 'custom') {
      const dims = getDimensionsForResolution(value);
      setWidth(String(dims.width));
      setHeight(String(dims.height));
      handleUpdate(value, String(dims.width), String(dims.height));
    } else {
        handleUpdate(value, width, height)
    }
  };

  const getDimensionsForResolution = (res: string) => {
    switch (res) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1440, height: 900 };
      default: return { width: 1920, height: 1080 };
    }
  };

  const handleUpdate = (res: 'mobile' | 'tablet' | 'desktop' | 'custom', w: string, h: string) => {
    const updates: Partial<Project> = { resolution: res };

    const newWidth = parseInt(w, 10);
    const newHeight = parseInt(h, 10);

    if (isNaN(newWidth) || newWidth <= 0) {
      showToast("Largura inválida.", "error");
      return;
    }
    if (isNaN(newHeight) || newHeight <= 0) {
      showToast("Altura inválida.", "error");
      return;
    }

    // TODO: Add scale validation based on originalResolution as per user request

    updates.width = newWidth;
    updates.height = newHeight;
    
    onUpdate(updates);
  };

  const isMobile = originalResolution === 'mobile';
  const isTablet = originalResolution === 'tablet';
  const isDesktop = originalResolution === 'desktop';

  return (
    <div className="space-y-4">
        <div>
            <Label htmlFor="resolution">Resolução da tela</Label>
            <Select 
              value={resolution} 
              onValueChange={handleResolutionChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile" disabled={isTablet || isDesktop}>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </div>
                </SelectItem>
                <SelectItem value="tablet" disabled={isMobile || isDesktop}>
                  <div className="flex items-center gap-2">
                    <Tablet className="w-4 h-4" />
                    Tablet
                  </div>
                </SelectItem>
                <SelectItem value="desktop" disabled={isMobile || isTablet}>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Desktop
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Personalizado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
        </div>

        {resolution === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-width">Largura (px)</Label>
                <Input
                  id="custom-width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  onBlur={() => handleUpdate(resolution, width, height)}
                  placeholder="375"
                  type="number"
                />
              </div>
              <div>
                <Label htmlFor="custom-height">Altura (px)</Label>
                <Input
                  id="custom-height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  onBlur={() => handleUpdate(resolution, width, height)}
                  placeholder="812"
                  type="number"
                />
              </div>
            </div>
        )}
    </div>
  );
}
