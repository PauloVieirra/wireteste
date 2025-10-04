import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';

interface FigmaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string, token: string) => void;
}

const FigmaImportModal: React.FC<FigmaImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaToken, setFigmaToken] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('figmaToken');
    if (storedToken) {
      setFigmaToken(storedToken);
    }
  }, []);

  const handleImportClick = () => {
    if (figmaUrl && figmaToken) {
      localStorage.setItem('figmaToken', figmaToken);
      onImport(figmaUrl, figmaToken);
    } else {
      // Handle case where URL or token is missing
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Figma</DialogTitle>
          <DialogDescription>
            To import your design, please provide a link to your Figma file and a personal access token. You can generate a token from your Figma account settings under the "Personal access tokens" section.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="figma-url">Figma File URL</Label>
            <Input
              id="figma-url"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/file/..."
            />
          </div>
          <div>
            <Label htmlFor="figma-token">Figma Access Token</Label>
            <Input
              id="figma-token"
              type="password"
              value={figmaToken}
              onChange={(e) => setFigmaToken(e.target.value)}
              placeholder="Your personal access token"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImportClick}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FigmaImportModal;