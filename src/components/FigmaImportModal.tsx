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
  onImport: (importData: any) => Promise<void>;
  fetchFigmaData: (url: string, token: string) => Promise<any>;
}

const FigmaImportModal: React.FC<FigmaImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  fetchFigmaData,
}) => {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retrievedFonts, setRetrievedFonts] = useState<string[] | null>(null);
  const [importData, setImportData] = useState<any | null>(null);

  const handleFetchClick = async () => {
    const storedToken = localStorage.getItem('figma_token');
    if (!figmaUrl) {
      alert('Por favor informe o Figma File URL.');
      return;
    }

    if (!storedToken) {
      alert('Token do Figma não encontrado. Por favor configure o token em Configuração do Figma (menu principal).');
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchFigmaData(figmaUrl, storedToken);
      setImportData(data);
      setRetrievedFonts(data.fontFamilies);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (importData) {
      setIsLoading(true);
      try {
        await onImport(importData);
      } finally {
        setIsLoading(false);
        onClose();
      }
    }
  };

  const handleCancel = () => {
    setRetrievedFonts(null);
    setImportData(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Figma</DialogTitle>
          <DialogDescription>
            {retrievedFonts 
              ? 'The following font families were found in your Figma file. Please ensure you have them installed or available in your project.'
              : 'To import your design, please provide a link to your Figma file and a personal access token. You can generate a token from your Figma account settings under the "Personal access tokens" section.'
            }
          </DialogDescription>
        </DialogHeader>
        {retrievedFonts ? (
          <div>
            <h3 className="font-bold mb-2">Font Families Found:</h3>
            <ul className="list-disc list-inside bg-gray-100 p-4 rounded-md">
              {retrievedFonts.map(font => <li key={font}>{font}</li>)}
            </ul>
          </div>
        ) : (
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
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          {retrievedFonts ? (
            <Button onClick={handleConfirmImport} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Import
            </Button>
          ) : (
            <Button onClick={handleFetchClick} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Project
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FigmaImportModal;