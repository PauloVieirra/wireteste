import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// --- TYPE DEFINITIONS ---
interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
}

interface Test {
  id: string;
  admin_id: string;
  name: string;
  type: 'mapa_calor';
  config: any;
  is_active: boolean;
}

interface Filter {
  id: string;
  type: 'age' | 'gender' | 'education';
  value: any;
  isEliminatory: boolean;
}

interface CustomQuestion {
  id: string;
  text: string;
  expectedAnswer: string;
  weight: number;
  isEliminatory: boolean;
}

interface CreateUsabilityTestProps {
  user: User;
  onSaveTest: (test: Partial<Test>) => void;
  selectedProject: Project;
}

// --- COMPONENT --- 

export function CreateUsabilityTest({ user, onSaveTest, selectedProject }: CreateUsabilityTestProps) {
  const [testName, setTestName] = useState('');
  const [isTestOpen, setIsTestOpen] = useState(true);
  const [mission, setMission] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);

  // --- HANDLERS ---

  const handleAddFilter = () => {
    setFilters([...filters, { id: Date.now().toString(), type: 'age', value: { min: 18, max: 65 }, isEliminatory: false }]);
  };

  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const handleUpdateFilter = (id: string, field: keyof Filter, value: any) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: Date.now().toString(), text: '', expectedAnswer: '', weight: 1, isEliminatory: false }]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleUpdateQuestion = (id: string, field: keyof CustomQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleSave = () => {
    if (!selectedProject || !testName) {
      alert('Por favor, dê um nome ao teste.');
      return;
    }

    const config = {
      projectId: selectedProject.id,
      mission,
      recruitmentType: isTestOpen ? 'open' : 'closed',
      filters: isTestOpen ? [] : filters,
      customQuestions: questions,
      approvalRule: { matchPercentage: 90 },
    };

    const newTest: Partial<Test> = {
      admin_id: user.id,
      name: testName,
      type: 'mapa_calor',
      config,
      is_active: true,
    };

    onSaveTest(newTest);
  };

  // --- RENDER --- 

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 mb-20">
      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>1. Informações Gerais</CardTitle>
          <CardDescription>
            Você está criando um teste para o projeto: <strong>{selectedProject.name}</strong>.
            Dê um nome para sua campanha de teste.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-name">Nome do Teste</Label>
            <Input 
              id="test-name" 
              placeholder="Ex: Teste de Usabilidade do Checkout"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Config */}
      <Card>
        <CardHeader>
          <CardTitle>2. Configuração do Teste</CardTitle>
          <CardDescription>Defina a missão principal e o tipo de recrutamento para os participantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mission">Missão do Teste</Label>
            <Input 
              id="mission" 
              placeholder="Ex: Encontre e clique na página de Termos de Uso"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="test-type" checked={isTestOpen} onCheckedChange={setIsTestOpen} />
            <Label htmlFor="test-type">{isTestOpen ? 'Teste Aberto' : 'Teste Fechado'}</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {isTestOpen 
              ? 'Qualquer usuário com o link poderá participar do teste.' 
              : 'Apenas usuários que correspondem aos filtros de perfil poderão participar.'
            }
          </p>
        </CardContent>
      </Card>

      {/* Profile Filters */}
      {!isTestOpen && (
        <Card>
          <CardHeader>
            <CardTitle>3. Filtros de Perfil (Teste Fechado)</CardTitle>
            <CardDescription>Defina os critérios para os participantes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filters.map((filter, index) => (
              <div key={filter.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Filtro {index + 1}</Label>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveFilter(filter.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="col-span-2 md:col-span-1">
                    <Label>Tipo</Label>
                    <Select value={filter.type} onValueChange={(v: Filter['type']) => handleUpdateFilter(filter.id, 'type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="age">Idade</SelectItem>
                        <SelectItem value="gender">Sexo</SelectItem>
                        <SelectItem value="education">Formação Superior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {filter.type === 'age' && (
                    <div className="grid grid-cols-2 gap-2 col-span-2">
                       <div>
                         <Label>Mín.</Label>
                         <Input type="number" value={filter.value.min} onChange={(e) => handleUpdateFilter(filter.id, 'value', { ...filter.value, min: parseInt(e.target.value) || 0 })} />
                       </div>
                       <div>
                         <Label>Máx.</Label>
                         <Input type="number" value={filter.value.max} onChange={(e) => handleUpdateFilter(filter.id, 'value', { ...filter.value, max: parseInt(e.target.value) || 0 })} />
                       </div>
                    </div>
                  )}
                  {filter.type === 'gender' && (
                     <div className="col-span-2">
                        <Label>Opção</Label>
                        <Select value={filter.value} onValueChange={(v) => handleUpdateFilter(filter.id, 'value', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="nao-binario">Não-binário</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                            <SelectItem value="nao-informar">Prefiro não responder</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                  )}
                  {filter.type === 'education' && (
                     <div className="col-span-2">
                        <Label>Opção</Label>
                        <Select value={filter.value} onValueChange={(v) => handleUpdateFilter(filter.id, 'value', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sim">Sim</SelectItem>
                            <SelectItem value="nao">Não</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                  )}
                </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id={`eliminatory-filter-${filter.id}`} checked={filter.isEliminatory} onCheckedChange={(c) => handleUpdateFilter(filter.id, 'isEliminatory', c)} />
                    <Label htmlFor={`eliminatory-filter-${filter.id}`}>Eliminatório</Label>
                  </div>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddFilter} className="mt-4">
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Filtro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas de Qualificação</CardTitle>
          <CardDescription>Adicione perguntas para qualificar ou desqualificar participantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {questions.map((q, index) => (
              <div key={q.id} className="p-4 border rounded-lg space-y-3">
                 <div className="flex justify-between items-center">
                  <Label>Pergunta {index + 1}</Label>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(q.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Pergunta</Label>
                  <Input value={q.text} onChange={(e) => handleUpdateQuestion(q.id, 'text', e.target.value)} placeholder="Ex: Você usa aplicativos de banco?" />
                </div>
                <div className="space-y-2">
                  <Label>Resposta Esperada</Label>
                  <Input value={q.expectedAnswer} onChange={(e) => handleUpdateQuestion(q.id, 'expectedAnswer', e.target.value)} placeholder="Ex: Sim" />
                </div>
                <div className="space-y-2">
                  <Label>Peso</Label>
                  <Input type="number" value={q.weight} onChange={(e) => handleUpdateQuestion(q.id, 'weight', parseInt(e.target.value) || 1)} />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id={`eliminatory-q-${q.id}`} checked={q.isEliminatory} onCheckedChange={(c) => handleUpdateQuestion(q.id, 'isEliminatory', c)} />
                  <Label htmlFor={`eliminatory-q-${q.id}`}>Eliminatória</Label>
                </div>
              </div>
           ))}
           <Button variant="outline" onClick={handleAddQuestion} className="mt-4">
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Pergunta
            </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave}>Salvar Teste de Usabilidade</Button>
      </div>
    </div>
  );
}
