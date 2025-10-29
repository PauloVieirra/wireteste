import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Users, X, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { useToast } from './ToastProvider';
import type { Survey } from '../../types';

interface SendSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: Survey | null;
}

interface Profile {
    id: string;
    name: string;
    email: string;
}

export function SendSurveyModal({ isOpen, onClose, survey }: SendSurveyModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(2); // Start at step 2
  const [groupSize, setGroupSize] = useState<number | null>(null);
  const [foundTesters, setFoundTesters] = useState<Profile[]>([]);
  const [isFinding, setIsFinding] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setStep(2);
      setGroupSize(null);
      setFoundTesters([]);
      setIsFinding(false);
      setIsSending(false);
    }
  }, [isOpen]);

  const handleFindTesters = async () => {
    if (!groupSize) return;
    setIsFinding(true);
    
    let { data, error } = await supabase
      .from('users_profile')
      .select('id, name, email')
      .eq('role', 'user');

    if (error) {
        showToast('Erro ao buscar testadores: ' + error.message, 'error');
        setIsFinding(false);
        return;
    }

    if (data) {
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, groupSize);
        setFoundTesters(selected);
    }
    
    setIsFinding(false);
    setStep(3);
  };

  const handleSendInvitations = async () => {
    if (!survey || foundTesters.length === 0) {
      showToast('Nenhum testador selecionado.', 'error');
      return;
    }
    setIsSending(true);

    const surveyName = survey.name;
    const currentAdminId = (await supabase.auth.getUser()).data.user?.id;

    for (const tester of foundTesters) {
      const surveyLink = `${window.location.origin}/?view=user-survey&surveyId=${survey.id}`;
      const emailBody = `Olá ${tester.name},\n\nVocê foi convidado para responder a pesquisa \"${surveyName}\".\n\nClique no link para iniciar: ${surveyLink}`;
      const newEmailMessage = {
        sender_id: currentAdminId,
        subject: `Convite para a pesquisa: ${surveyName}`,
        body: emailBody,
        surveyId: survey.id,
        created_at: new Date().toISOString(),
        status: 'pending',
      };

      const { data: existing, error: fetchError } = await supabase.from('emails').select('messages').eq('receiver_id', tester.id).single();
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Erro ao buscar email para ${tester.email}:`, fetchError);
        continue;
      }

      const updatedMessages = existing ? [...existing.messages, newEmailMessage] : [newEmailMessage];
      await supabase.from('emails').upsert({ receiver_id: tester.id, messages: updatedMessages, last_updated_at: new Date().toISOString() }, { onConflict: 'receiver_id' });
    }

    setIsSending(false);
    setStep(5); // Go to success step
  };

  const renderStepContent = () => {
    switch (step) {
      case 2:
        const pricePerPerson = 1.50;
        return (
          <div>
            <DialogTitle className="text-2xl text-center">Enviar Pesquisa</DialogTitle>
            <DialogDescription className="text-center mb-6">Selecione para quantos testadores você quer enviar a pesquisa.</DialogDescription>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantos testadores você precisa?</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[5, 10, 15, 20].map(count => {
                        const totalPrice = pricePerPerson * count;
                        const isSelected = groupSize === count;
                        return (
                        <Card 
                            key={count}
                            className={`text-center cursor-pointer transition-all transform hover:-translate-y-1 ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
                            onClick={() => setGroupSize(count)}
                        >
                            <CardContent className="p-4 flex flex-col items-center justify-center">
                            <h3 className="text-2xl font-bold">{count}</h3>
                            <p className="text-sm text-muted-foreground mb-2">Testadores</p>
                            <div className="my-4">
                                <p className="text-xs text-muted-foreground">Custo total</p>
                                <p className="text-xl font-semibold">R$ {totalPrice.toFixed(2)}</p>
                            </div>
                            </CardContent>
                        </Card>
                        );
                    })}
                    </div>
                </div>
            </div>
          </div>
        );
      case 3:
        return (
            <div>
                <DialogTitle className="text-2xl text-center">Revise os Testadores</DialogTitle>
                <DialogDescription className="text-center mb-6">
                    Encontramos {foundTesters.length} testadores para sua pesquisa. Você pode remover algum se desejar.
                </DialogDescription>
                <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                    {foundTesters.map(tester => (
                        <div key={tester.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                            <div>
                                <p className="font-semibold">{tester.name}</p>
                                <p className="text-sm text-muted-foreground">{tester.email}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setFoundTesters(testers => testers.filter(t => t.id !== tester.id))}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        );
    case 4:
        return (
            <div>
                <DialogTitle className="text-2xl text-center">Confirmar Envio</DialogTitle>
                <DialogDescription className="text-center mb-6">
                    Você está prestes a enviar a pesquisa <span className="font-semibold">{survey?.name}</span> para <span className="font-semibold">{foundTesters.length}</span> testadores.
                </DialogDescription>
                <div className="text-center">
                    <Send className="w-16 h-16 mx-auto text-primary"/>
                    <p className="mt-4 text-muted-foreground">Após o envio, os convites aparecerão na caixa de entrada de cada testador.</p>
                </div>
            </div>
        );
    case 5:
        return (
            <div className="text-center p-4">
                <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
                <DialogTitle className="text-2xl text-center mt-4">Convites Enviados!</DialogTitle>
                <DialogDescription className="text-center mt-2 mb-6">
                    Os testadores foram notificados. Você pode acompanhar os resultados no dashboard assim que eles concluírem a pesquisa.
                </DialogDescription>
            </div>
        );
      default:
        return <div>Etapa desconhecida</div>;
    }
  };

  const handleNext = () => {
    if (step === 2) {
        handleFindTesters();
    } else if (step === 4) {
        handleSendInvitations();
    } else {
        setStep(step + 1);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-8">
        {renderStepContent()}
        <DialogFooter className="mt-8 pt-4 border-t">
          {step > 2 && step < 5 && <Button variant="outline" onClick={() => setStep(step - 1)}>Voltar</Button>}
          {step < 4 && 
            <Button 
                onClick={handleNext} 
                disabled={
                (step === 2 && !groupSize) ||
                (step === 3 && foundTesters.length === 0)
                }
            >
                {isFinding ? 'Encontrando...' : (step === 2 ? 'Encontrar Testadores' : 'Próximo')}
            </Button>
          }
          {step === 4 && 
            <Button onClick={handleNext} disabled={isSending}>
                {isSending ? 'Enviando...' : 'Confirmar e Enviar'}
            </Button>
          }
          {step === 5 && 
            <Button onClick={onClose}> Fechar</Button>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
