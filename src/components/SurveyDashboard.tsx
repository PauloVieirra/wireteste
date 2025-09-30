import React, { useEffect, useState, useMemo } from 'react';
import { useDashboard } from './DashboardProvider';
import { getSurveyById } from '../utils/supabase/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Survey {
  id: string;
  admin_id: string;
  nome: string;
  tipo: 'aberta' | 'fechada';
  descricao: string;
  created_at: string;
  perguntas: any[]; // Assuming questions are part of the survey object
}

interface SurveyDashboardProps {
  itemId: string;
}

export function SurveyDashboard({ itemId }: SurveyDashboardProps) {
  const { data: surveyResponses, loading: responsesLoading, error: responsesError } = useDashboard();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loadingSurvey, setLoadingSurvey] = useState(true);
  const [surveyError, setSurveyError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      setLoadingSurvey(true);
      setSurveyError(null);
      try {
        const fetchedSurvey = await getSurveyById(itemId);
        setSurvey(fetchedSurvey);
      } catch (err: any) {
        console.error("Error fetching survey data:", err);
        setSurveyError(`Erro ao carregar dados da pesquisa: ${err.message}`);
      } finally {
        setLoadingSurvey(false);
      }
    };

    fetchSurvey();
  }, [itemId]);

  const groupedResponses = useMemo(() => {
    if (!surveyResponses) return [];

    const responsesByUser = surveyResponses.reduce((acc, response) => {
      const user = response.user_email || response.user_name || 'Anônimo';
      if (!acc[user]) {
        acc[user] = {
          user,
          created_at: response.created_at,
          answers: {}
        };
      }
      // Find the question text to make the dashboard more readable
      const questionText = survey?.perguntas.find(p => p.id === response.pergunta_id)?.texto || response.pergunta_id;
      acc[user].answers[questionText] = response.resposta;
      return acc;
    }, {} as { [key: string]: { user: string; created_at: string; answers: { [key: string]: any } } });

    return Object.values(responsesByUser);
  }, [surveyResponses, survey]);

  if (responsesLoading || loadingSurvey) {
    return <div className="p-6 text-center">Carregando dados da pesquisa...</div>;
  }

  if (responsesError || surveyError) {
    return <div className="p-6 text-center text-red-500">Erro ao carregar dashboard da pesquisa: {responsesError || surveyError}</div>;
  }

  if (!survey) {
    return (
      <div className="p-6 text-center">
        <h2>Dashboard de Pesquisa</h2>
        <p className="text-muted-foreground mb-6">Pesquisa não encontrada ou não carregada.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Dashboard de Pesquisa - {survey.nome}</h2>
          <p className="text-muted-foreground">Análise das respostas da pesquisa</p>
        </div>
        {/* <Button onClick={exportReport}><Download className="w-4 h-4 mr-2" />Exportar relatório</Button> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Respostas ({groupedResponses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {groupedResponses.length === 0 ? (
            <div className="text-center py-8"><p className="text-muted-foreground">Nenhuma resposta registrada para esta pesquisa ainda.</p></div>
          ) : (
            <div className="space-y-4">
              {groupedResponses.map((response) => (
                <div key={response.user} className="p-4 border rounded-lg">
                  <h4 className="font-medium">Participante: {response.user}</h4>
                  <p className="text-sm text-muted-foreground">Respondido em: {new Date(response.created_at).toLocaleString('pt-BR')}</p>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(response.answers, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
