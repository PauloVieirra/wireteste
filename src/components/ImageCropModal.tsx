import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface ImageCropModalProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ imageSrc, open, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleCropComplete = (_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleSave = () => {
    if (croppedAreaPixels) {
      onCropComplete(null, croppedAreaPixels);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cortar Imagem</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div style={{ position: 'relative', width: '100%', height: 300, background: '#222' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={handleSave}>Salvar Corte</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
