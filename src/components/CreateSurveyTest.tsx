import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { PlusCircle, Trash2, X } from 'lucide-react';
import { Checkbox } from './ui/checkbox';

// --- TYPE DEFINITIONS ---

interface User {
  id: string;
}

// Based on the new schema
interface SurveyQuestionOption {
  id: string;
  text: string;
}

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'aberta' | 'multipla_escolha' | 'sim_nao';
  weight: number;
  isEliminatory: boolean;
  options: SurveyQuestionOption[];
}

interface CreateSurveyTestProps {
  user: User;
  onSaveSurvey: (surveyData: any) => void; // Simplified for now
}

// --- COMPONENT ---

export function CreateSurveyTest({ user, onSaveSurvey }: CreateSurveyTestProps) {
  const [surveyName, setSurveyName] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [isSurveyOpen, setIsSurveyOpen] = useState(true);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  // --- HANDLERS ---

  const addQuestion = (type: SurveyQuestion['type']) => {
    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(),
      text: '',
      type,
      weight: 1,
      isEliminatory: false,
      options: type === 'multipla_escolha' ? [{ id: Date.now().toString(), text: '' }] : [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (qId: string) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestion = (qId: string, field: keyof SurveyQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const addOption = (qId: string) => {
    const newOption = { id: Date.now().toString(), text: '' };
    const updatedQuestions = questions.map(q => 
      q.id === qId ? { ...q, options: [...q.options, newOption] } : q
    );
    setQuestions(updatedQuestions);
  };

  const removeOption = (qId: string, oId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === qId ? { ...q, options: q.options.filter(o => o.id !== oId) } : q
    );
    setQuestions(updatedQuestions);
  };

  const updateOption = (qId: string, oId: string, text: string) => {
    const updatedQuestions = questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: q.options.map(o => o.id === oId ? { ...o, text } : o) };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  const handleSave = () => {
    const surveyData = {
      nome: surveyName,
      descricao: surveyDescription,
      tipo: isSurveyOpen ? 'aberta' : 'fechada',
      perguntas: questions,
      
    };
    onSaveSurvey(surveyData);
  };

  // --- RENDER --- 

  const renderQuestionFields = (q: SurveyQuestion) => {
    switch (q.type) {
      case 'multipla_escolha':
        return (
          <div className="pl-4 mt-2 space-y-2">
            <Label>Opções</Label>
            {q.options.map(opt => (
              <div key={opt.id} className="flex items-center gap-2">
                <Input 
                  value={opt.text} 
                  onChange={(e) => updateOption(q.id, opt.id, e.target.value)} 
                  placeholder="Texto da opção"
                />
                <Button variant="ghost" size="icon" onClick={() => removeOption(q.id, opt.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addOption(q.id)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Opção
            </Button>
          </div>
        );
      case 'sim_nao':
        return <p className="text-sm text-muted-foreground pl-4 mt-2">O usuário responderá com "Sim" ou "Não".</p>;
      case 'aberta':
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 mb-20">
      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>1. Informações da Pesquisa</CardTitle>
          <CardDescription>Dê um nome e uma descrição para sua pesquisa ou formulário de entrevista.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="Nome da Pesquisa"
            value={surveyName}
            onChange={(e) => setSurveyName(e.target.value)}
          />
          <Input 
            placeholder="Descrição (opcional)"
            value={surveyDescription}
            onChange={(e) => setSurveyDescription(e.target.value)}
          />
           <div className="flex items-center space-x-2 pt-2">
            <Switch id="survey-type" checked={isSurveyOpen} onCheckedChange={setIsSurveyOpen} />
            <Label htmlFor="survey-type">{isSurveyOpen ? 'Pesquisa Aberta' : 'Pesquisa Fechada'}</Label>
          </div>
        </CardContent>
      </Card>

      {/* Questions Builder */}
      <Card>
        <CardHeader>
          <CardTitle>2. Construtor de Perguntas</CardTitle>
          <CardDescription>Adicione e configure as perguntas da sua pesquisa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-semibold">Pergunta {index + 1} ({q.type.replace('_', ' ')})</Label>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <Input 
                placeholder="Digite o texto da pergunta aqui..."
                value={q.text}
                onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
              />
              {renderQuestionFields(q)}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                    <Label>Peso:</Label>
                    <Input type="number" value={q.weight} onChange={(e) => updateQuestion(q.id, 'weight', parseInt(e.target.value) || 1)} className="w-20" />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id={`eliminatory-q-${q.id}`} checked={q.isEliminatory} onCheckedChange={(c) => updateQuestion(q.id, 'isEliminatory', c)} />
                    <Label htmlFor={`eliminatory-q-${q.id}`}>Eliminatória</Label>
                </div>
              </div>
            </div>
          ))}
          <div className="border-t pt-4">
            <Label className="mb-2 block">Adicionar Nova Pergunta</Label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => addQuestion('aberta')}>Aberta</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('multipla_escolha')}>Múltipla Escolha</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('sim_nao')}>Sim/Não</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave}>Salvar Pesquisa</Button>
      </div>
    </div>
  );
}