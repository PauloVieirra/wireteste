import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Users, Cpu, X, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useToast } from '../ToastProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ConfigureTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProject: any; // Adjust with proper type
}

interface Profile {
    id: string;
    name: string;
    email: string;
}

export function ConfigureTestModal({ isOpen, onClose, selectedProject }: ConfigureTestModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [audience, setAudience] = useState<'real' | 'ai' | null>(null);
  const [groupSize, setGroupSize] = useState<number | null>(null);
  const [foundTesters, setFoundTesters] = useState<Profile[]>([]);
  const [isFinding, setIsFinding] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [availableUsabilityTests, setAvailableUsabilityTests] = useState<any[]>([]);
  const [selectedUsabilityTestId, setSelectedUsabilityTestId] = useState('');

  useEffect(() => {
    if (isOpen && selectedProject) {
      const fetchUsabilityTests = async () => {
        const { data, error } = await supabase
          .from('tests')
          .select('id, name, type, config')
          .eq('config->>projectId', selectedProject.id);

        if (error) {
          showToast('Erro ao buscar testes de usabilidade: ' + error.message, 'error');
          return;
        }
        setAvailableUsabilityTests(data || []);
        if (data && data.length > 0) {
          setSelectedUsabilityTestId(data[0].id);
        }
      };
      fetchUsabilityTests();
    } else {
      // Reset state when modal is closed
      setStep(1);
      setAudience(null);
      setGroupSize(null);
      setFoundTesters([]);
      setIsFinding(false);
      setIsSending(false);
    }
  }, [isOpen, selectedProject, showToast]);

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
    if (!selectedUsabilityTestId || foundTesters.length === 0) {
      showToast('Nenhum testador selecionado.', 'error');
      return;
    }
    setIsSending(true);

    const selectedTest = availableUsabilityTests.find(t => t.id === selectedUsabilityTestId);
    const testName = selectedTest?.name || "Teste de Usabilidade";
    const currentAdminId = (await supabase.auth.getUser()).data.user?.id;

    for (const tester of foundTesters) {
      const testLink = `${window.location.origin}/?view=user-test&testId=${selectedUsabilityTestId}`;
      const emailBody = `Olá ${tester.name},\n\nVocê foi convidado para participar do teste \"${testName}\".\n\nClique no link para iniciar: ${testLink}`;
      const newEmailMessage = {
        sender_id: currentAdminId,
        subject: `Convite para o teste: ${testName}`,
        body: emailBody,
        testId: selectedUsabilityTestId,
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
      case 1:
        return (
          <div>
            <DialogTitle className="text-2xl text-center">Como você gostaria de testar?</DialogTitle>
            <DialogDescription className="text-center mb-6">Selecione o público para seu teste de usabilidade.</DialogDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className={`p-6 text-center cursor-pointer transition-all ${audience === 'real' ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
                onClick={() => setAudience('real')}
              >
                <CardContent className="flex flex-col items-center justify-center p-0">
                  <Users className="w-12 h-12 mb-4 text-primary" />
                  <h3 className="text-lg font-semibold">Pessoas Reais</h3>
                  <p className="text-sm text-muted-foreground mt-1">Receba feedback de usuários reais para validar suas ideias.</p>
                </CardContent>
              </Card>
              <Card 
                className={`p-6 text-center cursor-not-allowed bg-muted/50 transition-all ${audience === 'ai' ? 'ring-2 ring-ring' : ''}`}
                onClick={() => { /* Disabled for now */ }}
              >
                <CardContent className="flex flex-col items-center justify-center p-0">
                  <Cpu className="w-12 h-12 mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-muted-foreground">Inteligência Artificial</h3>
                  <p className="text-sm text-muted-foreground mt-1">Em breve: Simule interações e receba análises preditivas.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 2:
        const wireframeCount = selectedProject?.wireframes?.length || 0;
        const pricePerPerson = 3.20;
        return (
          <div>
            <DialogTitle className="text-2xl text-center">Configure seu Teste</DialogTitle>
            <DialogDescription className="text-center mb-6">Selecione qual teste enviar e para quantos testadores.</DialogDescription>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Qual teste você quer enviar?</label>
                    <Select value={selectedUsabilityTestId} onValueChange={setSelectedUsabilityTestId}>
                        <SelectTrigger><SelectValue placeholder="Selecione um teste" /></SelectTrigger>
                        <SelectContent>
                        {availableUsabilityTests.map(test => (
                            <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantos testadores você precisa?</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[5, 10, 15, 20].map(count => {
                        const totalPrice = wireframeCount > 0 ? wireframeCount * pricePerPerson * count : 0;
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
                    Encontramos {foundTesters.length} testadores para seu teste. Você pode remover algum se desejar.
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
                    Você está prestes a enviar o teste <span className="font-semibold">{availableUsabilityTests.find(t => t.id === selectedUsabilityTestId)?.name}</span> para <span className="font-semibold">{foundTesters.length}</span> testadores.
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
                    Os testadores foram notificados. Você pode acompanhar os resultados no dashboard assim que eles concluírem o teste.
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
          {step > 1 && step < 5 && <Button variant="outline" onClick={() => setStep(step - 1)}>Voltar</Button>}
          {step < 4 && 
            <Button 
                onClick={handleNext} 
                disabled={
                (step === 1 && !audience) ||
                (step === 2 && (!groupSize || !selectedUsabilityTestId)) ||
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
            <Button onClick={onClose}>Fechar</Button>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
