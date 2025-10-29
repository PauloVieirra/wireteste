import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PlusCircle, X } from 'lucide-react';

interface Option {
  id: string;
  text: string;
}

interface MultipleChoiceEditorProps {
  options: Option[];
  onOptionsChange: (options: Option[]) => void;
}

export function MultipleChoiceEditor({ options, onOptionsChange }: MultipleChoiceEditorProps) {
  const addOption = () => {
    onOptionsChange([...options, { id: Date.now().toString(), text: '' }]);
  };

  const removeOption = (optionId: string) => {
    onOptionsChange(options.filter(o => o.id !== optionId));
  };

  const updateOption = (optionId: string, text: string) => {
    onOptionsChange(options.map(o => o.id === optionId ? { ...o, text } : o));
  };

  return (
    <div className="pl-4 mt-2 space-y-2">
      {options.map((opt, index) => (
        <div key={opt.id} className="flex items-center gap-2">
          <Input
            value={opt.text}
            onChange={(e) => updateOption(opt.id, e.target.value)}
            placeholder={`Opção ${index + 1}`}
          />
          <Button variant="ghost" size="icon" onClick={() => removeOption(opt.id)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addOption}>
        <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Opção
      </Button>
    </div>
  );
}
