import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { useToast } from '../ToastProvider';
import type { User, UsabilityTest } from '../App'; // Importar User e UsabilityTest
import { Button } from '../ui/button'; // Adicionar Button import
import { Label } from '../ui/label'; // Adicionar Label import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'; // Adicionar Select imports
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'; // Importar componentes do Dialog

interface Project {
  id: string;
  name: string;
  resolution: 'mobile' | 'tablet' | 'desktop';
  wireframes: any[]; // Assumindo que wireframes é um array, ajustar se necessário
  createdAt: string;
  updated_at: string;
  gridConfig?: any;
  components: any[];
}

interface UsabilityTest {
  id: string;
  admin_id: string;
  name: string;
  type: 'mapa_calor' | 'eye_tracking' | 'face_tracking';
  config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateTestGroupProps {
  selectedProject: Project; // Manter selectedProject
}

interface DisplayItem {
  id: string;
  type: 'wireframe' | 'pesquisa' | 'mapa_calor';
  name: string;
  wireframeCount?: number; // Adicionado para armazenar a contagem de telas
}

interface Profile {
    id: string;
    name: string;
    email: string; // We need to join with auth.users to get this
    idade?: number;
    genero?: string;
    estado_civil?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    escolaridade?: string;
    ocupacao?: string;
    trabalha?: boolean;
    renda_mensal?: number;
    possui_filhos?: boolean;
    qtd_filhos?: number;
    possui_veiculo?: boolean;
    tipo_residencia?: string;
    acesso_internet?: boolean;
    dispositivo_principal?: string;
    disponibilidade_horario?: string;
}

interface Test {
  id?: string; // ID do grupo de teste (autogerado pelo Supabase, se configurado)
  usability_test_id: string; // Referencia o id do UsabilityTest
  type: 'open' | 'closed'; 
  tester_count?: number; // For open tests
  filters?: any; // For closed tests
  testers: string[]; // Array de user_profile ids (deve ser UUID[] se users_profile.id for UUID)
  created_at?: string;
}

const CreateTestGroup: React.FC<CreateTestGroupProps> = ({ selectedProject }) => {
  const { showToast } = useToast();
  const [availableUsabilityTests, setAvailableUsabilityTests] = useState<UsabilityTest[]>([]); // Testes de usabilidade disponíveis
  const [selectedUsabilityTestId, setSelectedUsabilityTestId] = useState(''); // ID do teste de usabilidade selecionado
  const [testerCount, setTesterCount] = useState<string | null>(null); // Começa como null, nenhum selecionado
  const [foundTesters, setFoundTesters] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [testType, setTestType] = useState<'open' | 'closed'>('open'); // 'open' ou 'closed'
  const [areTestersFound, setAreTestersFound] = useState(false); // Novo estado para controlar o fluxo do botão
  const [projectWireframeCount, setProjectWireframeCount] = useState(0); // Novo estado para a contagem de wireframes do projeto
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Estado para controlar a visibilidade do modal
  const [isConfirmingSelection, setIsConfirmingSelection] = useState(false); // Estado para o loading do modal
  const [showEmailReviewModal, setShowEmailReviewModal] = useState(false); // Novo estado para o modal de revisão de e-mail
  const [emailPreviewContent, setEmailPreviewContent] = useState(''); // Conteúdo do e-mail para prévia
  const [isSendingEmails, setIsSendingEmails] = useState(false); // Novo estado para controlar o envio de e-mails

  // Filter states for closed test
  const [filterAge, setFilterAge] = useState<number | '' >('');
  const [filterGender, setFilterGender] = useState<string>('');
  const [filterMaritalStatus, setFilterMaritalStatus] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('');
  const [filterEducation, setFilterEducation] = useState<string>('');
  const [filterOccupation, setFilterOccupation] = useState<string>('');
  const [filterWorks, setFilterWorks] = useState<boolean | '' >('');
  const [filterMonthlyIncome, setFilterMonthlyIncome] = useState<number | '' >('');
  const [filterHasChildren, setFilterHasChildren] = useState<boolean | '' >('');
  const [filterNumChildren, setFilterNumChildren] = useState<number | '' >('');
  const [filterHasVehicle, setFilterHasVehicle] = useState<boolean | '' >('');
  const [filterResidenceType, setFilterResidenceType] = useState<string>('');
  const [filterInternetAccess, setFilterInternetAccess] = useState<boolean | '' >('');
  const [filterMainDevice, setFilterMainDevice] = useState<string>('');
  const [filterAvailability, setFilterAvailability] = useState<string>('');

  console.log("DEBUG BUTTON STATE: selectedUsabilityTestId", selectedUsabilityTestId, "testType", testType, "testerCount", testerCount, "areTestersFound", areTestersFound, "foundTesters.length", foundTesters.length);

  useEffect(() => {
    if (!selectedProject) return; // Se não houver projeto selecionado, não busca testes

    const fetchUsabilityTests = async () => {
      const { data, error } = await supabase
        .from('tests') // CONTINUA BUSCANDO TESTES DE USABILIDADE NA TABELA 'tests'
        .select('id, name, type, config')
        .eq('config->>projectId', selectedProject.id); // Filtra por projectId no config

      if (error) {
        showToast('Erro ao buscar testes de usabilidade: ' + error.message, 'error');
        console.error("Erro ao buscar testes de usabilidade:", error); // DEBUG LOG
        return;
      }
      setAvailableUsabilityTests(data as UsabilityTest[]);
      console.log("Testes de usabilidade disponíveis:", data); // DEBUG LOG
      // Se houver apenas um teste, pré-seleciona ele
      if (data && data.length > 0) {
        setSelectedUsabilityTestId(data[0].id);
      }
    };
    fetchUsabilityTests();

    // Busca a contagem de wireframes do projeto selecionado
    if (selectedProject) {
      setProjectWireframeCount(selectedProject.wireframes.length);
    }

  }, [selectedProject]); // Dependência apenas do projeto selecionado

  // Reset areTestersFound when testType changes or selectedUsabilityTestId changes
  useEffect(() => {
    setAreTestersFound(false);
    setFoundTesters([]); // Clear found testers when test type or test selection changes
  }, [testType, selectedUsabilityTestId]);

  const handleFindTesters = async () => {
    if (!selectedUsabilityTestId) {
        showToast('Selecione um teste de usabilidade.', 'error');
        return;
    }
    setIsSearching(true);
    setFoundTesters([]);
    setAreTestersFound(false); // Reset before new search

    let query = supabase
      .from('users_profile')
      .select(`
        id,
        name,
        email,
        idade,
        genero,
        estado_civil,
        cidade,
        estado,
        pais,
        escolaridade,
        ocupacao,
        trabalha,
        renda_mensal,
        possui_filhos,
        qtd_filhos,
        possui_veiculo,
        tipo_residencia,
        acesso_internet,
        dispositivo_principal,
        disponibilidade_horario
      `)
      .eq('role', 'user'); // Re-adicionado
      // .eq('is_complite', true); // Removido temporariamente para depuração

    if (testType === 'closed') {
      query = query.eq('is_complite', true); // Adicionado para teste fechado
      // Apply filters for closed test
      if (filterAge !== '') { query = query.eq('idade', filterAge); }
      if (filterGender !== '') { query = query.eq('genero', filterGender); }
      if (filterMaritalStatus !== '') { query = query.eq('estado_civil', filterMaritalStatus); }
      if (filterCity !== '') { query = query.ilike('cidade', `%{filterCity}%`); }
      if (filterState !== '') { query = query.ilike('estado', `%{filterState}%`); }
      if (filterEducation !== '') { query = query.eq('escolaridade', filterEducation); }
      if (filterOccupation !== '') { query = query.ilike('ocupacao', `%{filterOccupation}%`); }
      if (filterWorks !== '') { query = query.eq('trabalha', filterWorks); }
      if (filterMonthlyIncome !== '') { query = query.gte('renda_mensal', filterMonthlyIncome); }
      if (filterHasChildren !== '') { query = query.eq('possui_filhos', filterHasChildren); }
      if (filterNumChildren !== '') { query = query.eq('qtd_filhos', filterNumChildren); }
      if (filterHasVehicle !== '') { query = query.eq('possui_veiculo', filterHasVehicle); }
      if (filterResidenceType !== '') { query = query.eq('tipo_residencia', filterResidenceType); }
      if (filterInternetAccess !== '') { query = query.eq('acesso_internet', filterInternetAccess); }
      if (filterMainDevice !== '') { query = query.eq('dispositivo_principal', filterMainDevice); }
      if (filterAvailability !== '') { query = query.ilike('disponibilidade_horario', `%{filterAvailability}%`); }
    }

    const { data, error } = await query;

    console.log("Dados de testadores retornados do Supabase:", data, "Erro Supabase:", error); // DEBUG LOG MAIS COMPLETO - Re-adicionado

    if (error) {
      showToast('Erro ao buscar testadores: ' + error.message, 'error');
      setIsSearching(false);
      setAreTestersFound(false); // Garantir que o estado seja resetado em caso de erro
      return;
    }
    
    let selected: Profile[] = [];
    if (testType === 'open') {
      // Randomly select testers for open test
      const shuffled = data.sort(() => 0.5 - Math.random());
      selected = shuffled.slice(0, parseInt(testerCount || '0')); // Use testerCount || '0' para garantir um valor padrão
    } else {
      // For closed test, all filtered users are selected (no random shuffle yet, or limit by testerCount if needed)
      selected = data as Profile[]; // Assuming data matches Profile interface after filtering
    }

    // Re-shape the data to match our Profile interface
    const finalTesters = selected.map((tester: any) => ({
        id: tester.id,
        name: tester.name,
        email: tester.email, // Agora vem direto de users_profile
        idade: tester.idade,
        genero: tester.genero,
        estado_civil: tester.estado_civil,
        cidade: tester.cidade,
        estado: tester.estado,
        pais: tester.pais,
        escolaridade: tester.escolaridade,
        ocupacao: tester.ocupacao,
        trabalha: tester.trabalha,
        renda_mensal: tester.renda_mensal,
        possui_filhos: tester.possui_filhos,
        qtd_filhos: tester.qtd_filhos,
        possui_veiculo: tester.possui_veiculo,
        tipo_residencia: tester.tipo_residencia,
        acesso_internet: tester.acesso_internet,
        dispositivo_principal: tester.dispositivo_principal,
        disponibilidade_horario: tester.disponibilidade_horario,
    }));

    setFoundTesters(finalTesters);
    setIsSearching(false);
    if (finalTesters.length > 0) {
      setAreTestersFound(true); // Testadores encontrados, pronto para enviar convites
    } else {
      setAreTestersFound(false); // Nenhum testador encontrado
    }
  };

  const handleSaveAndSendInvitations = async () => {
    // console.log("Botão Salvar Teste e Enviar Convites clicado!"); // Debug log
    if (!selectedUsabilityTestId || foundTesters.length === 0) {
      showToast('Selecione um teste de usabilidade e encontre testadores antes de enviar convites.', 'error');
      return;
    }

    setIsSendingEmails(true); // Inicia o estado de envio

    // 1. Save Test Group to a new 'test_groups' table
    const newTestEntry: Test = {
      usability_test_id: selectedUsabilityTestId, // Usa o ID do teste de usabilidade selecionado
      type: testType,
      testers: foundTesters.map(tester => tester.id),
    };

    if (testType === 'open') {
      newTestEntry.tester_count = parseInt(testerCount || '0'); // Use testerCount || '0' para garantir um valor padrão
    } else {
      // For closed tests, save the filters used
      newTestEntry.filters = {
        filterAge,
        filterGender,
        filterMaritalStatus,
        filterCity,
        filterState,
        filterEducation,
        filterOccupation,
        filterWorks,
        filterMonthlyIncome,
        filterHasChildren,
        filterNumChildren,
        filterHasVehicle,
        filterResidenceType,
        filterInternetAccess,
        filterMainDevice,
        filterAvailability,
      };
    }

    const { data: testGroupData, error: testGroupError } = await supabase.from('test_groups').insert([newTestEntry]).select(); // CORRIGIDO: Inserindo em test_groups

    if (testGroupError) {
      showToast('Erro ao salvar grupo de teste: ' + testGroupError.message, 'error');
      setIsSendingEmails(false); // Finaliza o estado de envio em caso de erro
      return;
    }

    const testId = selectedUsabilityTestId; // Usar o ID do teste de usabilidade selecionado
    const currentAdminId = (await supabase.auth.getUser()).data.user?.id || null; // Obter o ID do admin

    // 2. Send Invitations (save to 'emails' table with array of messages)
    const selectedUsabilityTest = availableUsabilityTests.find(t => t.id === selectedUsabilityTestId);
    const selectedUsabilityTestName = selectedUsabilityTest?.name || "Teste de Usabilidade Desconhecido";

    for (const tester of foundTesters) {
      const testLink = `${window.location.origin}/?view=user-test&testId=${testId}`;
      const emailSubject = `Convite para participar do teste do ${selectedUsabilityTestName}`;
      const emailBody = `Olá ${tester.name},

Você foi recrutado para participar do teste do ${selectedUsabilityTestName}. Clique no link abaixo para iniciar o teste.

${testLink}

Atenciosamente,
Equipe de Pesquisa`;

      const newEmailMessage = {
        sender_id: currentAdminId, // Incluir sender_id dentro da mensagem
        subject: emailSubject,
        body: emailBody,
        testId: testId, // Incluir testId na mensagem
        created_at: new Date().toISOString(),
        status: 'pending', // Adicionar status inicial
      };

      // Tentar buscar a linha existente para o receiver_id
      const { data: existingEmailRow, error: fetchError } = await supabase
        .from('emails')
        .select('messages')
        .eq('receiver_id', tester.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: no rows found (esperado se não houver linha)
        console.error(`Erro ao buscar email existente para ${tester.email}:`, fetchError);
        showToast(`Erro ao preparar convite para ${tester.name}`, 'error');
        continue; // Pula para o próximo testador
      }

      let updatedMessagesArray = existingEmailRow ? [...(existingEmailRow.messages as any[]), newEmailMessage] : [newEmailMessage];

      if (existingEmailRow) {
        // Atualizar a linha existente
        const { error: updateError } = await supabase
          .from('emails')
          .update({ messages: updatedMessagesArray, last_updated_at: new Date().toISOString() })
          .eq('receiver_id', tester.id);

        if (updateError) {
          console.error(`Erro ao atualizar email para ${tester.email}:`, updateError);
          showToast(`Erro ao enviar convite para ${tester.name}`, 'error');
        }
      } else {
        // Inserir uma nova linha
        const { error: insertError } = await supabase
          .from('emails')
          .insert({
            receiver_id: tester.id,
            messages: updatedMessagesArray,
          });

        if (insertError) {
          console.error(`Erro ao inserir email para ${tester.email}:`, insertError);
          showToast(`Erro ao enviar convite para ${tester.name}`, 'error');
        }
      }
    }

    showToast('Grupo de Teste salvo e convites enviados com sucesso!', 'success');
    setIsSendingEmails(false); // Finaliza o estado de envio
    setShowEmailReviewModal(false); // Fecha o modal de revisão de e-mail
  };

  // Função para pré-visualizar o e-mail
  const handlePreviewEmail = async () => { // Adicionado 'async'
    if (!selectedUsabilityTestId || foundTesters.length === 0) {
      showToast('Selecione um teste de usabilidade e encontre testadores antes de pré-visualizar o e-mail.', 'error');
      return;
    }

    const selectedUsabilityTest = availableUsabilityTests.find(t => t.id === selectedUsabilityTestId);
    const selectedUsabilityTestName = selectedUsabilityTest?.name || "Teste de Usabilidade Desconhecido";

    const firstTester = foundTesters[0];
    if (!firstTester) {
      showToast('Nenhum testador encontrado para pré-visualizar o e-mail.', 'error');
      return;
    }

    const testLink = `${window.location.origin}/?view=user-test&testId=${selectedUsabilityTestId}`;
    const emailSubject = `Convite para participar do teste do ${selectedUsabilityTestName}`;
    const emailBody = `Olá ${firstTester.name},

Você foi recrutado para participar do teste do ${selectedUsabilityTestName}. Clique no link abaixo para iniciar o teste.

${testLink}

Atenciosamente,
Equipe de Pesquisa`;

    const currentAdminId = (await supabase.auth.getUser()).data.user?.id || null; // Obter o ID do admin

    const newEmailMessage = {
      sender_id: currentAdminId, // Incluir sender_id dentro da mensagem
      subject: emailSubject,
      body: emailBody,
      testId: selectedUsabilityTestId, // Incluir testId na mensagem
      created_at: new Date().toISOString(),
      status: 'pending', // Adicionar status inicial para pré-visualização
    };

    setEmailPreviewContent(`Assunto: ${newEmailMessage.subject}\n\n${newEmailMessage.body}`); // Pré-visualização agora usa o objeto de mensagem
    setShowEmailReviewModal(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Filters */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-bold mb-4">Filtros do Grupo</h2>
          <div className="space-y-4">
            {/* Selecionar um teste de usabilidade existente */}
            <div>
              <Label className="block text-sm font-medium text-gray-700">Teste de Usabilidade</Label>
              <Select value={selectedUsabilityTestId} onValueChange={setSelectedUsabilityTestId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um teste" />
                </SelectTrigger>
                <SelectContent>
                  <option value="">Selecione um teste</option>
                  {availableUsabilityTests.map(test => (
                    <SelectItem key={test.id} value={test.id}>{test.name} ({test.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type of Test Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Teste</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="testType"
                    value="open"
                    checked={testType === 'open'}
                    onChange={() => { setTestType('open'); setTesterCount(null); setAreTestersFound(false); setFoundTesters([]); }} // Resetar estados ao mudar tipo
                  />
                  <span className="ml-2">Teste Aberto</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="testType"
                    value="closed"
                    checked={testType === 'closed'}
                    onChange={() => { setTestType('closed'); setTesterCount(null); setAreTestersFound(false); setFoundTesters([]); }} // Resetar estados ao mudar tipo
                  />
                  <span className="ml-2">Teste Fechado</span>
                </label>
              </div>
            </div>

            {/* Conditional rendering for Test Type options */}
            {testType === 'open' ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Selecione o Tamanho do Grupo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[5, 10, 15, 20].map(count => {
                    const wireframeCount = projectWireframeCount; // Usar o estado de contagem de wireframes
                    const pricePerPerson = 3.20;
                    const totalPrice = wireframeCount > 0 ? wireframeCount * pricePerPerson : 0;

                    return (
                      <div key={count} className="border p-4 rounded-lg shadow-sm flex flex-col items-center text-center">
                        <h4 className="text-md font-bold">Grupo de {count} Pessoas</h4>
                        <p className="text-sm text-gray-600">Ideal para testes rápidos e abrangentes.</p>
                        <img src="https://via.placeholder.com/100" alt="Grupo de Teste" className="my-3 rounded-full" /> {/* Placeholder image */}
                        <p className="text-lg font-bold">R${totalPrice.toFixed(2)} / pessoa</p>
                        <button
                          onClick={() => setTesterCount(count.toString())}
                          className={`mt-2 px-4 py-2 rounded-md text-white ${testerCount === count.toString() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-200 hover:bg-blue-300'}`}
                        >
                          {testerCount === count.toString() ? 'Selecionado' : 'Selecionar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                  {(selectedUsabilityTestId && testerCount) && ( // Só mostra se um teste e um contador de testadores forem selecionados
                    <Button onClick={() => setShowConfirmationModal(true)} className="w-full mt-4">
                      Próximo
                    </Button>
                  )}

              </div>
            ) : (
              // Closed Test Options (Filters)
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-3">Filtros para Teste Fechado</h3>
                {/* Idade */}
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">Idade</label>
                  <input
                    type="number"
                    id="age"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="Ex: 25"
                    value={filterAge}
                    onChange={e => setFilterAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                  />
                </div>

                {/* Gênero */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gênero</label>
                  <select
                    id="gender"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={filterGender}
                    onChange={e => setFilterGender(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                {/* Estado Civil */}
                <div>
                  <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">Estado Civil</label>
                  <select
                    id="maritalStatus"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={filterMaritalStatus}
                    onChange={e => setFilterMaritalStatus(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                  </select>
                </div>

                {/* Cidade/Estado */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Cidade/Estado</label>
                  <input
                    type="text"
                    id="location"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="Ex: São Paulo, SP"
                    value={filterCity}
                    onChange={e => setFilterCity(e.target.value)}
                  />
                </div>

                {/* Escolaridade */}
                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-gray-700">Escolaridade</label>
                  <select
                    id="education"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={filterEducation}
                    onChange={e => setFilterEducation(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="fundamental">Ensino Fundamental</option>
                    <option value="medio">Ensino Médio</option>
                    <option value="superior">Ensino Superior</option>
                    <option value="pos_graduacao">Pós-graduação</option>
                  </select>
                </div>

                {/* Ocupação */}
                <div>
                  <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">Ocupação</label>
                  <input
                    type="text"
                    id="occupation"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="Ex: Desenvolvedor"
                    value={filterOccupation}
                    onChange={e => setFilterOccupation(e.target.value)}
                  />
                </div>

                {/* Trabalho */}
                <div>
                  <label htmlFor="works" className="block text-sm font-medium text-gray-700">Trabalha Atualmente?</label>
                  <select
                    id="works"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={filterWorks.toString()}
                    onChange={e => setFilterWorks(e.target.value === 'true' ? true : e.target.value === 'false' ? false : '')}
                  >
                    <option value="">Selecione</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>

                {/* Renda Mensal */}
                <div>
                  <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700">Renda Mensal</label>
                  <input
                    type="number"
                    id="monthlyIncome"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="Ex: 3000"
                    value={filterMonthlyIncome}
                    onChange={e => setFilterMonthlyIncome(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  />
                </div>

                {/* Possui Filhos */}
                <div>
                  <label htmlFor="hasChildren" className="block text-sm font-medium text-gray-700">Possui Filhos?</label>
                  <select
                    id="hasChildren"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={filterHasChildren.toString()}
                    onChange={e => setFilterHasChildren(e.target.value === 'true' ? true : e.target.value === 'false' ? false : '')}
                  >
                    <option value="">Selecione</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>

                {/* Quantidade de Filhos (se possui) */}
                <div>
                  <label htmlFor="numChildren" className="block text-sm font-medium text-gray-700">Quantidade de Filhos</label>
                  <input
                    type="number"
                    id="numChildren"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="Ex: 2"
                    value={filterNumChildren}
                    onChange={e => setFilterNumChildren(e.target.value === '' ? '' : parseInt(e.target.value))}
                  />
                </div>

                {/* Possui Veículo */}
                <div>
                  <label htmlFor="hasVehicle" className="block text-sm font-medium text-gray-700">Possui Veículo?</label>
                  <select
                    id="hasVehicle"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={filterHasVehicle.toString()}
                    onChange={e => setFilterHasVehicle(e.target.value === 'true' ? true : e.target.value === 'false' ? false : '')}
                  >
                    <option value="">Selecione</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>

                {/* Tipo de Residência */}
                <div>
                  <label htmlFor="residenceType" className="block text-sm font-medium text-gray-700">Tipo de Residência</label>
                  <select
                    id="residenceType"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={filterResidenceType}
                    onChange={e => setFilterResidenceType(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                {/* Acesso à Internet */}
                <div>
                  <label htmlFor="internetAccess" className="block text-sm font-medium text-gray-700">Acesso à Internet?</label>
                  <select
                    id="internetAccess"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={filterInternetAccess.toString()}
                    onChange={e => setFilterInternetAccess(e.target.value === 'true' ? true : e.target.value === 'false' ? false : '')}
                  >
                    <option value="">Selecione</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>

                {/* Dispositivo Principal */}
                <div>
                  <label htmlFor="mainDevice" className="block text-sm font-medium text-gray-700">Dispositivo Principal</label>
                  <select
                    id="mainDevice"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={filterMainDevice}
                    onChange={e => setFilterMainDevice(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="smartphone">Smartphone</option>
                    <option value="computador">Computador</option>
                    <option value="tablet">Tablet</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                {/* Disponibilidade de Horário */}
                <div>
                  <label htmlFor="availability" className="block text-sm font-medium text-gray-700">Disponibilidade de Horário</label>
                  <input
                    type="text"
                    id="availability"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="Ex: Manhã, Tarde, Noite, Fins de Semana"
                    value={filterAvailability}
                    onChange={e => setFilterAvailability(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button onClick={handleFindTesters} disabled={isSearching} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              {isSearching ? 'Buscando...' : 'Encontrar Testadores'}
            </button>

            {areTestersFound && (
              <button
                onClick={handlePreviewEmail} // Chama a pré-visualização do e-mail
                disabled={isSearching || isSendingEmails} // Desabilita durante busca ou envio
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 mt-4"
              >
                {isSendingEmails ? 'Enviando Convites...' : 'Enviar Convites'}
              </button>
            )}

          </div>
        </div>

        {/* Column 2: Results */}
        <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-4">Testadores Selecionados</h2>
            {foundTesters.length > 0 ? (
                <div className="space-y-3">
                    {foundTesters.map(tester => (
                        <div key={tester.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-grow">
                                <div className="font-semibold">{tester.name}</div>
                                <div className="text-sm text-gray-500">{tester.email}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p>Nenhum testador encontrado ou buscado ainda.</p>
                </div>
            )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação do Grupo de Teste</DialogTitle>
            <DialogDescription>
              Você selecionou um grupo de {testerCount} pessoas para o teste de usabilidade. O custo total para este grupo será de R${(projectWireframeCount * 3.20).toFixed(2)} por pessoa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>Cancelar</Button>
            <Button 
              onClick={async () => {
                setIsConfirmingSelection(true);
                await handleFindTesters(); // Chama a função para encontrar testadores
                setIsConfirmingSelection(false);
                setShowConfirmationModal(false); // Fecha o modal após encontrar testadores
              }}
              disabled={isConfirmingSelection || isSearching} // Desabilita enquanto confirma ou busca
            >
              {isConfirmingSelection ? 'Confirmando...' : 'Confirmar e Encontrar Testadores'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Review Modal */}
      <Dialog open={showEmailReviewModal} onOpenChange={setShowEmailReviewModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Revisar Convites de E-mail</DialogTitle>
            <DialogDescription>
              Este é um rascunho do e-mail que será enviado aos testadores. Por favor, revise antes de enviar.
            </DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap p-4 border rounded-md bg-gray-50 text-sm">
            {emailPreviewContent}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailReviewModal(false)}>Cancelar</Button>
            <Button 
              onClick={handleSaveAndSendInvitations}
              disabled={isSendingEmails} // Desabilita enquanto envia
            >
              {isSendingEmails ? 'Enviando...' : 'Confirmar Envio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateTestGroup;