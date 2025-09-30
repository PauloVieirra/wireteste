import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mail, Play, User as UserIcon } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { useLoading } from './GlobalLoading';

interface UserHomePageProps {
  onGoToProfile: () => void;
  refreshKey: number; // Nova prop para forçar recarga
}

interface MessageContent {
  sender_id: string; // ID do remetente
  subject: string;
  body: string;
  testId: string;
  created_at: string;
  status?: 'pending' | 'completed';
}

interface InboxItem {
  receiver_id: string; // ID do destinatário (chave primária da tabela emails)
  messages: MessageContent[]; // Array de objetos de mensagem
  last_updated_at: string;
}

export function UserHomePage({ onGoToProfile, refreshKey }: UserHomePageProps) {
  const [user, setUser] = useState<any>(null);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]); // Renomeado de 'tests' para 'inboxItems'
  const [isLoadingInbox, setIsLoadingInbox] = useState(true); // Novo estado de carregamento
  const { hideLoading } = useLoading();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: sessionUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !sessionUser) {
          console.error("Erro ao buscar usuário da sessão:", userError);
          return;
        }
        if (!user) {
          setUser(sessionUser);
        }

        const { data: emailData, error: emailsError } = await supabase
          .from('emails')
          .select('receiver_id, messages, last_updated_at')
          .eq('receiver_id', sessionUser.id);

        if (emailsError) {
          console.error("Erro ao buscar emails:", emailsError);
          return;
        }

        let parsedInboxItems: InboxItem[] = [];
        if (emailData && emailData.length > 0) {
          const emailRow = emailData[0];
          parsedInboxItems = [{
            receiver_id: emailRow.receiver_id,
            messages: emailRow.messages as MessageContent[],
            last_updated_at: emailRow.last_updated_at,
          }];
        }
        setInboxItems(parsedInboxItems);
      } finally {
        setIsLoadingInbox(false);
        hideLoading();
      }
    };

    setIsLoadingInbox(true);
    fetchData();

    if (user?.id) {
      const channel = supabase
        .channel(`emails:receiver_id=eq.${user.id}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'emails',
            filter: `receiver_id=eq.${user.id}`
        }, (payload) => {
            fetchData();
        })
        .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
    }
  }, [user?.id, refreshKey, hideLoading]);

  // Função para iniciar o teste (redirecionar para a tela de teste de usuário)
  const onStartTest = (testId: string) => {
    window.location.href = `/?view=user-test&testId=${testId}`;
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-red-500 text-2xl font-bold mb-4">ESTA É A USERHOMEPAGE REAL</h1> {/* Texto de verificação */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Bem-vindo, {user?.user_metadata?.name || user?.email}!</h1>
            <p className="text-lg text-muted-foreground">Aqui estão os convites de teste de usabilidade que você recebeu.</p>
        </div>
        <Button variant="outline" onClick={onGoToProfile}>
            <UserIcon className="w-4 h-4 mr-2" />
            Meu Perfil
        </Button>
      </div>

      {isLoadingInbox ? (
        <p>Carregando mensagens...</p>
      ) : inboxItems.length === 0 || inboxItems[0].messages.length === 0 ? (
        <Card className="w-full max-w-2xl mx-auto text-center py-12">
          <CardHeader className="flex flex-col items-center">
            <Mail className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl">Nenhuma mensagem na caixa de entrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Parece que você não tem nenhum convite de teste pendente. Verifique novamente mais tarde!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inboxItems[0].messages.map((message, index) => {
            const isCompleted = message.status === 'completed';
            return (
              <Card key={index} className={isCompleted ? 'opacity-60 bg-muted/30' : ''}>
                <CardHeader>
                  <CardTitle>{message.subject}</CardTitle>
                  <p className="text-sm text-muted-foreground">Recebido em: {new Date(message.created_at).toLocaleDateString()}</p>
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                  <p className="text-muted-foreground text-sm">{message.body.split('\n')[0]}...</p>
                  <Button onClick={() => onStartTest(message.testId)} disabled={isCompleted}>
                    {isCompleted ? 'Teste Realizado' : <><Play className="w-4 h-4 mr-2" /> Iniciar Teste</>}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}