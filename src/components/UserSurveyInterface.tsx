import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import type { Survey } from '../../types';

interface UserSurveyInterfaceProps {
  survey: Survey;
  onFinishSurvey: (answers: any) => void;
}

export function UserSurveyInterface({ survey, onFinishSurvey }: UserSurveyInterfaceProps) {
  const [answers, setAnswers] = useState<{[key: string]: string}>({});

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    // Here you would typically save the answers to the database
    onFinishSurvey(answers);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{survey.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {survey.questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <Label htmlFor={`question-${question.id}`}>{index + 1}. {question.text}</Label>
              <Textarea 
                id={`question-${question.id}`}
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Digite sua resposta aqui..."
              />
            </div>
          ))}
          <Button onClick={handleSubmit} className="w-full">Enviar Respostas</Button>
        </CardContent>
      </Card>
    </div>
  );
}
