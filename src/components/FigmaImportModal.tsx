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
import { Loader2 } from 'lucide-react';

interface FigmaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string, token: string) => Promise<void>;
}

const FigmaImportModal: React.FC<FigmaImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaToken, setFigmaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('figmaToken');
    if (storedToken) {
      setFigmaToken(storedToken);
    }
  }, []);

  const handleImportClick = async () => {
    if (figmaUrl && figmaToken) {
      setIsLoading(true);
      localStorage.setItem('figmaToken', figmaToken);
      try {
        await onImport(figmaUrl, figmaToken);
      } finally {
        setIsLoading(false);
      }
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImportClick} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FigmaImportModal;