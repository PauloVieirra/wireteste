import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { useToast } from '../ToastProvider';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

const ProfileForm: React.FC = () => {
  const [name, setName] = useState('');
  const [idade, setIdade] = useState<number | ''>('');
  const [genero, setGenero] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [pais, setPais] = useState('');
  const [escolaridade, setEscolaridade] = useState('');
  const [ocupacao, setOcupacao] = useState('');
  const [trabalha, setTrabalha] = useState<boolean>(false);
  const [rendaMensal, setRendaMensal] = useState<number | ''>('');
  const [possuiFilhos, setPossuiFilhos] = useState<boolean>(false);
  const [qtdFilhos, setQtdFilhos] = useState<number | ''>('');
  const [possuiVeiculo, setPossuiVeiculo] = useState<boolean>(false);
  const [tipoResidencia, setTipoResidencia] = useState('');
  const [acessoInternet, setAcessoInternet] = useState<boolean>(false);
  const [dispositivoPrincipal, setDispositivoPrincipal] = useState('');
  const [disponibilidadeHorario, setDisponibilidadeHorario] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { showToast } = useToast();
  const [isComplete, setIsComplete] = useState<boolean>(false); // Novo estado para is_complete

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        showToast('Erro ao buscar usuário', 'error');
      } else {
        setUser(data.user);
        fetchProfile(data.user.id);
      }
    };
    fetchUser();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users_profile')
      .select('*') // Selecionar todas as colunas
      .eq('id', userId)
      .single();
    if (data) {
      setName(data.name || '');
      setIdade(data.idade || '');
      setGenero(data.genero || '');
      setEstadoCivil(data.estado_civil || '');
      setCidade(data.cidade || '');
      setEstado(data.estado || '');
      setPais(data.pais || '');
      setEscolaridade(data.escolaridade || '');
      setOcupacao(data.ocupacao || '');
      setTrabalha(data.trabalha || false);
      setRendaMensal(data.renda_mensal || '');
      setPossuiFilhos(data.possui_filhos || false);
      setQtdFilhos(data.qtd_filhos || '');
      setPossuiVeiculo(data.possui_veiculo || false);
      setTipoResidencia(data.tipo_residencia || '');
      setAcessoInternet(data.acesso_internet || false);
      setDispositivoPrincipal(data.dispositivo_principal || '');
      setDisponibilidadeHorario(data.disponibilidade_horario || '');
      setIsComplete(data.is_complete || false); // Carregar o status de is_complete
    }
    if (error) {
      showToast('Erro ao carregar perfil: ' + error.message, 'error');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Você precisa estar logado para salvar o perfil.', 'error');
      return;
    }

    // Validação de todos os campos para definir is_complete
    const isFormValid = (
      name !== '' &&
      idade !== '' && idade >= 0 &&
      genero !== '' &&
      estadoCivil !== '' &&
      cidade !== '' &&
      estado !== '' &&
      pais !== '' &&
      escolaridade !== '' &&
      ocupacao !== '' &&
      // 'trabalha' e 'acessoInternet' são booleanos e sempre terão um valor
      (trabalha ? (rendaMensal !== '' && rendaMensal >= 0) : true) &&
      // 'possuiFilhos' é booleano
      (possuiFilhos ? (qtdFilhos !== '' && qtdFilhos >= 0) : true) &&
      // 'possuiVeiculo' é booleano
      tipoResidencia !== '' &&
      dispositivoPrincipal !== '' &&
      disponibilidadeHorario !== ''
    );

    if (!isFormValid) {
      showToast('Por favor, preencha todos os campos obrigatórios para completar seu perfil.', 'error');
      // Não retorna aqui para permitir salvar parcialmente, mas is_complete será false
    }

    setLoading(true);

    const profileData = {
      id: user.id,
      name,
      idade: idade === '' ? null : idade,
      genero: genero || null,
      estado_civil: estadoCivil || null,
      cidade: cidade || null,
      estado: estado || null,
      pais: pais || null,
      escolaridade: escolaridade || null,
      ocupacao: ocupacao || null,
      trabalha,
      renda_mensal: rendaMensal === '' ? null : rendaMensal,
      possui_filhos: possuiFilhos,
      qtd_filhos: possuiFilhos ? (qtdFilhos === '' ? null : qtdFilhos) : null,
      possui_veiculo: possuiVeiculo,
      tipo_residencia: tipoResidencia || null,
      acesso_internet: acessoInternet,
      dispositivo_principal: dispositivoPrincipal || null,
      disponibilidade_horario: disponibilidadeHorario || null,
      is_complete: isFormValid, // Definir is_complete com base na validação
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('users_profile').upsert(profileData, { onConflict: 'id' });

    if (error) {
      showToast('Erro ao salvar o perfil: ' + error.message, 'error');
    } else {
      showToast('Perfil salvo com sucesso!', 'success');
      setIsComplete(isFormValid); // Atualizar o estado local de isComplete
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Meu Perfil</h1>
      {loading ? (
        <p className="text-center mb-4">Carregando perfil...</p>
      ) : (
        !isComplete && user && user.role === 'user' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Perfil Incompleto!</strong>
            <span className="block sm:inline"> Por favor, preencha todos os campos para ativar seu perfil de testador.</span>
          </div>
        )
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          
          {/* Idade */}
          <div>
            <Label htmlFor="idade">Idade</Label>
            <Input id="idade" type="number" value={idade} onChange={(e) => setIdade(Number(e.target.value))} min="0" />
          </div>
          
          {/* Gênero */}
          <div>
            <Label htmlFor="genero">Gênero</Label>
            <Select value={genero} onValueChange={setGenero}>
              <SelectTrigger id="genero"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="nao_binario">Não Binário</SelectItem>
                <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Estado Civil */}
          <div>
            <Label htmlFor="estadoCivil">Estado Civil</Label>
            <Select value={estadoCivil} onValueChange={setEstadoCivil}>
              <SelectTrigger id="estadoCivil"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                <SelectItem value="uniao_estavel">União Estável</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Cidade */}
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          
          {/* Estado */}
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Input id="estado" type="text" value={estado} onChange={(e) => setEstado(e.target.value)} />
          </div>
          
          {/* País */}
          <div>
            <Label htmlFor="pais">País</Label>
            <Input id="pais" type="text" value={pais} onChange={(e) => setPais(e.target.value)} />
          </div>
          
          {/* Escolaridade */}
          <div>
            <Label htmlFor="escolaridade">Escolaridade</Label>
            <Select value={escolaridade} onValueChange={setEscolaridade}>
              <SelectTrigger id="escolaridade"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                <SelectItem value="medio">Ensino Médio</SelectItem>
                <SelectItem value="superior">Ensino Superior</SelectItem>
                <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                <SelectItem value="mestrado">Mestrado</SelectItem>
                <SelectItem value="doutorado">Doutorado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Ocupação */}
          <div>
            <Label htmlFor="ocupacao">Ocupação</Label>
            <Input id="ocupacao" type="text" value={ocupacao} onChange={(e) => setOcupacao(e.target.value)} />
          </div>
          
          {/* Trabalha */}
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="trabalha" checked={trabalha} onCheckedChange={setTrabalha} />
            <Label htmlFor="trabalha">Trabalha Atualmente?</Label>
          </div>
          
          {/* Renda Mensal (condicional se trabalha) */}
          {trabalha && (
            <div>
              <Label htmlFor="rendaMensal">Renda Mensal (BRL)</Label>
              <Input id="rendaMensal" type="number" value={rendaMensal} onChange={(e) => setRendaMensal(Number(e.target.value))} min="0" step="0.01" />
            </div>
          )}
          
          {/* Possui Filhos */}
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="possuiFilhos" checked={possuiFilhos} onCheckedChange={setPossuiFilhos} />
            <Label htmlFor="possuiFilhos">Possui Filhos?</Label>
          </div>
          
          {/* Quantidade de Filhos (condicional se possui_filhos) */}
          {possuiFilhos && (
            <div>
              <Label htmlFor="qtdFilhos">Quantidade de Filhos</Label>
              <Input id="qtdFilhos" type="number" value={qtdFilhos} onChange={(e) => setQtdFilhos(Number(e.target.value))} min="0" />
            </div>
          )}
          
          {/* Possui Veículo */}
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="possuiVeiculo" checked={possuiVeiculo} onCheckedChange={setPossuiVeiculo} />
            <Label htmlFor="possuiVeiculo">Possui Veículo?</Label>
          </div>
          
          {/* Tipo de Residência */}
          <div>
            <Label htmlFor="tipoResidencia">Tipo de Residência</Label>
            <Select value={tipoResidencia} onValueChange={setTipoResidencia}>
              <SelectTrigger id="tipoResidencia"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="casa_propria">Casa Própria</SelectItem>
                <SelectItem value="alugada">Alugada</SelectItem>
                <SelectItem value="com_familiares">Com Familiares</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Acesso à Internet */}
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="acessoInternet" checked={acessoInternet} onCheckedChange={setAcessoInternet} />
            <Label htmlFor="acessoInternet">Possui Acesso à Internet?</Label>
          </div>
          
          {/* Dispositivo Principal de Acesso à Internet */}
          <div>
            <Label htmlFor="dispositivoPrincipal">Dispositivo Principal de Acesso à Internet</Label>
            <Select value={dispositivoPrincipal} onValueChange={setDispositivoPrincipal}>
              <SelectTrigger id="dispositivoPrincipal"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="smartphone">Smartphone</SelectItem>
                <SelectItem value="computador">Computador (Desktop/Notebook)</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Disponibilidade de Horário para Testes */}
          <div>
            <Label htmlFor="disponibilidadeHorario">Disponibilidade de Horário para Testes</Label>
            <Select value={disponibilidadeHorario} onValueChange={setDisponibilidadeHorario}>
              <SelectTrigger id="disponibilidadeHorario"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manha">Manhã (08h-12h)</SelectItem>
                <SelectItem value="tarde">Tarde (13h-18h)</SelectItem>
                <SelectItem value="noite">Noite (19h-22h)</SelectItem>
                <SelectItem value="madrugada">Madrugada (23h-07h)</SelectItem>
                <SelectItem value="qualquer">Qualquer horário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Salvando...' : 'Salvar Perfil'}
        </Button>
      </form>
    </div>
  );
};

export default ProfileForm;