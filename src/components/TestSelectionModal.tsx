import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Play } from 'lucide-react';

interface UsabilityTest {
  id: string;
  name: string;
  type: 'mapa_calor' | 'eye_tracking' | 'face_tracking';
}

interface TestSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: UsabilityTest[];
  onSelectTest: (testId: string, testType: UsabilityTest['type']) => void;
}

export function TestSelectionModal({ isOpen, onClose, tests, onSelectTest }: TestSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecione um teste</DialogTitle>
          <DialogDescription>
            Este projeto tem múltiplos testes disponíveis. Por favor, escolha qual você gostaria de iniciar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-4">
          {tests.map((test) => (
            <Button
              key={test.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSelectTest(test.id, test.type)}
            >
              <Play className="w-4 h-4 mr-2" />
              {test.name} ({test.type})
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}