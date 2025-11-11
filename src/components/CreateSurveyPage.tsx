import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { MultipleChoiceEditor } from './SurveyEditors/MultipleChoiceEditor';
import { LikertScaleEditor } from './SurveyEditors/LikertScaleEditor';
import { MatrixEditor } from './SurveyEditors/MatrixEditor';
import { saveSurvey } from '../utils/supabase/supabaseClient';
import { useToast } from './ToastProvider';

// --- Type Definitions ---

type SurveyType = 'qualitativa' | 'quantitativa' | 'satisfacao';
type QuestionType = 'aberta' | 'fechada' | 'escala_likert' | 'multipla_escolha' | 'matriz';

interface QuestionOption {
  id: string;
  text: string;
}

interface MatrixItem {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  // for Likert Scale
  scale?: number;
  startLabel?: string;
  middleLabel?: string;
  endLabel?: string;
  // for Matrix
  rows?: MatrixItem[];
  columns?: MatrixItem[];
}

interface SurveyDraft {
  name: string;
  type: SurveyType;
  questions: Question[];
}

import type { Survey } from '../types';

interface CreateSurveyPageProps {
  onBack: () => void;
  survey?: Survey;
}

const SURVEY_DRAFT_KEY = 'survey_draft';

export function CreateSurveyPage({ onBack, survey }: CreateSurveyPageProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SurveyType>('qualitativa');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const { showToast } = useToast();

  const isEditMode = !!survey;

  useEffect(() => {
    if (survey) {
      setName(survey.name);
      setType(survey.type);
      setQuestions(survey.questions);
    } else {
      const savedDraft = localStorage.getItem(SURVEY_DRAFT_KEY);
      if (savedDraft) {
        setShowDraftDialog(true);
      }
    }
  }, [survey]);

  const addQuestion = (questionType: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: questionType,
      options: questionType === 'multipla_escolha' ? [{ id: Date.now().toString(), text: '' }] : [],
      scale: questionType === 'escala_likert' ? 5 : undefined,
      startLabel: questionType === 'escala_likert' ? 'Discordo Totalmente' : undefined,
      middleLabel: questionType === 'escala_likert' ? 'Neutro' : undefined,
      endLabel: questionType === 'escala_likert' ? 'Concordo Totalmente' : undefined,
      rows: questionType === 'matriz' ? [{ id: Date.now().toString(), text: '' }] : undefined,
      columns: questionType === 'matriz' ? [{ id: Date.now().toString(), text: '' }] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId: string, newText: string) => {
    setQuestions(questions.map(q => q.id === questionId ? { ...q, text: newText } : q));
  };

  const handleOptionsChange = (questionId: string, options: QuestionOption[]) => {
    setQuestions(questions.map(q => q.id === questionId ? { ...q, options } : q));
  };

  const handleQuestionPropertyChange = (questionId: string, prop: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === questionId ? { ...q, [prop]: value } : q));
  };

  const handlePublish = async () => {
    if (!name.trim()) {
      showToast('O nome da pesquisa é obrigatório.', 'error');
      return;
    }
    if (questions.length === 0) {
      showToast('A pesquisa deve ter pelo menos uma pergunta.', 'error');
      return;
    }

    try {
      await saveSurvey({ id: survey?.id, name, type, questions });
      showToast(isEditMode ? 'Pesquisa atualizada com sucesso!' : 'Pesquisa publicada com sucesso!', 'success');
      if (!isEditMode) {
        clearDraft();
      }
      onBack();
    } catch (error) {
      console.error('Failed to publish survey:', error);
      showToast(isEditMode ? 'Erro ao atualizar a pesquisa.' : 'Erro ao publicar a pesquisa.', 'error');
    }
  };

  // Draft helpers: save, load, discard and clear draft from localStorage
  const saveDraft = () => {
    try {
      const draft: SurveyDraft = { name, type, questions };
      localStorage.setItem(SURVEY_DRAFT_KEY, JSON.stringify(draft));
      showToast('Rascunho salvo localmente.', 'success');
    } catch (err) {
      console.error('Failed to save draft:', err);
      showToast('Erro ao salvar rascunho.', 'error');
    }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(SURVEY_DRAFT_KEY);
      if (!raw) {
        setShowDraftDialog(false);
        showToast('Nenhum rascunho encontrado.', 'info');
        return;
      }
      const draft: SurveyDraft = JSON.parse(raw);
      setName(draft.name || '');
      setType(draft.type || 'qualitativa');
      setQuestions(draft.questions || []);
      setShowDraftDialog(false);
      showToast('Rascunho carregado.', 'success');
    } catch (err) {
      console.error('Failed to load draft:', err);
      showToast('Erro ao carregar rascunho.', 'error');
    }
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(SURVEY_DRAFT_KEY);
      setShowDraftDialog(false);
      showToast('Rascunho descartado.', 'success');
    } catch (err) {
      console.error('Failed to discard draft:', err);
      showToast('Erro ao descartar rascunho.', 'error');
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(SURVEY_DRAFT_KEY);
    } catch (err) {
      console.error('Failed to clear draft:', err);
    }
  };

  const renderQuestionEditor = (question: Question) => {
    switch (question.type) {
      case 'multipla_escolha':
        return (
          <MultipleChoiceEditor
            options={question.options}
            onOptionsChange={(options) => handleOptionsChange(question.id, options)}
          />
        );
      case 'escala_likert':
        return (
          <LikertScaleEditor
            scale={question.scale || 5}
            onScaleChange={(value) => handleQuestionPropertyChange(question.id, 'scale', value)}
            startLabel={question.startLabel || ''}
            onStartLabelChange={(value) => handleQuestionPropertyChange(question.id, 'startLabel', value)}
            middleLabel={question.middleLabel || ''}
            onMiddleLabelChange={(value) => handleQuestionPropertyChange(question.id, 'middleLabel', value)}
            endLabel={question.endLabel || ''}
            onEndLabelChange={(value) => handleQuestionPropertyChange(question.id, 'endLabel', value)}
          />
        );
      case 'matriz':
        return (
          <MatrixEditor
            rows={question.rows || []}
            onRowsChange={(value) => handleQuestionPropertyChange(question.id, 'rows', value)}
            columns={question.columns || []}
            onColumnsChange={(value) => handleQuestionPropertyChange(question.id, 'columns', value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 mb-20">
      {!isEditMode && (
        <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rascunho Encontrado</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem um rascunho de pesquisa salvo. Deseja continuar de onde parou ou descartá-lo?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={discardDraft}>Descartar</AlertDialogCancel>
              <AlertDialogAction onClick={loadDraft}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{isEditMode ? 'Editar Pesquisa' : 'Criar Nova Pesquisa'}</h1>
          <p className="text-muted-foreground">Configure os detalhes e as perguntas da sua pesquisa.</p>
        </div>
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Detalhes da Pesquisa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="survey-name">Nome da Pesquisa</Label>
            <Input
              id="survey-name"
              placeholder="Ex: Pesquisa de Satisfação do Cliente"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="survey-type">Tipo da Pesquisa</Label>
            <Select value={type} onValueChange={(value: SurveyType) => setType(value)}>
              <SelectTrigger id="survey-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualitativa">Qualitativa</SelectItem>
                <SelectItem value="quantitativa">Quantitativa</SelectItem>
                <SelectItem value="satisfacao">Pesquisa de Satisfação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Perguntas</CardTitle>
          <CardDescription>Adicione as perguntas que farão parte da sua pesquisa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="p-4 border rounded-lg space-y-4 bg-muted/20">
              <div className="flex justify-between items-center">
                <Label className="font-semibold">Pergunta {index + 1} <span className="text-xs font-normal text-muted-foreground">({q.type})</span></Label>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <Input
                placeholder="Digite o texto da pergunta aqui..."
                value={q.text}
                onChange={(e) => updateQuestion(q.id, e.target.value)}
              />
              {renderQuestionEditor(q)}
            </div>
          ))}
          <div className="border-t pt-4">
            <Label className="mb-2 block">Adicionar Nova Pergunta</Label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => addQuestion('aberta')}>Aberta</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('fechada')}>Fechada (Sim/Não)</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('multipla_escolha')}>Múltipla Escolha</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('escala_likert')}>Escala Likert</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('matriz')}>Matriz</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {!isEditMode && (
          <Button variant="outline" onClick={saveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Rascunho
          </Button>
        )}
        <Button onClick={handlePublish}>{isEditMode ? 'Salvar Alterações' : 'Publicar Pesquisa'}</Button>
      </div>
    </div>
  );
}
''