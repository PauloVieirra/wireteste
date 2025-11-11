# 🧪 Guia de Teste - Wireframe Auto Layout

## Setup Inicial

### Pré-Requisitos
- ✅ Projeto aberto
- ✅ Pelo menos um wireframe criado
- ✅ Alguns elementos adicionados ao wireframe (retângulos, textos, etc.)

## Teste 1: Verificar Propriedades do Wireframe

**Objetivo**: Confirmar que a seção de Auto Layout aparece nas propriedades

**Passos**:
1. Abra um wireframe
2. Na barra lateral direita, clique na aba **Propriedades**
3. Clique na tela (canvas) sem selecionar nenhum elemento
4. Procure pela seção **Auto Layout** abaixo de "Dimensões da Tela"

**Resultado esperado**: 
- [ ] Seção "Auto Layout" visível
- [ ] 3 botões: "Desativar", "↔️ Horizontal", "↕️ Vertical"
- [ ] Controles desmarcados inicialmente

---

## Teste 2: Ativar Auto Layout Horizontal

**Objetivo**: Verificar se auto layout horizontal organiza elementos

**Passos**:
1. Adicione 3-4 retângulos ao wireframe
2. Espaçe-os aleatoriamente
3. Clique em **↔️ Horizontal**
4. Observe a mudança no canvas

**Resultado esperado**:
- [ ] Elementos se reorganizam em linha horizontal
- [ ] Elementos mantêm sua altura
- [ ] Elementos estão lado a lado sem sobreposição

---

## Teste 3: Configurar Espaçamento (Item Spacing)

**Objetivo**: Verificar se o espaçamento entre elementos funciona

**Passos**:
1. Com auto layout horizontal ativado
2. Localize o campo **"Espaçamento entre elementos"**
3. Mude o valor de 0 para 20
4. Observe o espaço entre elementos no canvas

**Resultado esperado**:
- [ ] Espaço aumenta entre os elementos
- [ ] Espaço é uniforme
- [ ] Alteração é instantânea

---

## Teste 4: Configurar Padding

**Objetivo**: Verificar se o padding funciona

**Passos**:
1. Com auto layout ativo
2. Na seção **Padding**:
   - Modo linked (padrão): Altere para 16
3. Observe o espaço das bordas do wireframe

**Resultado esperado**:
- [ ] Elementos afastam das bordas
- [ ] Espaço é de 16px em todos os lados
- [ ] Alteração é instantânea

---

## Teste 5: Alterar Alinhamento

**Objetivo**: Verificar se o alinhamento funciona

**Passos**:
1. Com auto layout ativo
2. Na seção **Alinhamento**, veja a grade 3x3
3. Clique no botão do **centro** (meio-meio)
4. Observe os elementos no canvas

**Resultado esperado**:
- [ ] Elementos centralizam
- [ ] Grid mostra seleção visual
- [ ] Comportamento varia conforme direção (horizontal vs vertical)

---

## Teste 6: Modo Vertical

**Objetivo**: Verificar se auto layout vertical funciona

**Passos**:
1. Clique em **↕️ Vertical**
2. Observe a reorganização

**Resultado esperado**:
- [ ] Elementos se reorganizam em coluna (de cima para baixo)
- [ ] Elementos mantêm sua largura
- [ ] Espaçamento e padding funcionam

---

## Teste 7: Desativar Auto Layout

**Objetivo**: Verificar se desativar funciona

**Passos**:
1. Com auto layout ativo
2. Clique em **Desativar**
3. Observe o canvas

**Resultado esperado**:
- [ ] Elementos mantêm posição anterior
- [ ] Nenhuma reorganização
- [ ] Controles ficam desativados

---

## Teste 8: Modo Individual de Padding

**Objetivo**: Verificar se padding individual funciona

**Passos**:
1. Com auto layout ativo
2. Na seção **Padding**, clique no ícone de corrente (desligar)
3. Configure valores diferentes:
   - Superior: 24
   - Direito: 12
   - Inferior: 8
   - Esquerdo: 16
4. Observe o espaçamento

**Resultado esperado**:
- [ ] Espaçamento diferente em cada lado
- [ ] Modo linked desativado
- [ ] Alterações são instantâneas

---

## Teste 9: Undo/Redo

**Objetivo**: Verificar se histórico funciona com auto layout

**Passos**:
1. Com auto layout configurado
2. Pressione **Ctrl+Z** (Windows/Linux) ou **Cmd+Z** (Mac)
3. Observe a mudança
4. Pressione **Ctrl+Y** para refazer

**Resultado esperado**:
- [ ] Undo desfaz as alterações de auto layout
- [ ] Redo restaura as alterações
- [ ] Funciona múltiplas vezes

---

## Teste 10: Persistência

**Objetivo**: Verificar se as alterações são salvas

**Passos**:
1. Configure auto layout com valores específicos
2. Clique em **Atualizar** (salvar)
3. Feche o navegador/aba
4. Reabra o projeto

**Resultado esperado**:
- [ ] Auto layout está ativado
- [ ] Configurações são mantidas (espaçamento, padding, alinhamento)
- [ ] Elementos estão na mesma posição

---

## Teste 11: Justificação (Justify Content)

**Objetivo**: Verificar distribuição de elementos

**Passos**:
1. Com auto layout horizontal
2. Configure padding: 16px
3. Clique na grade de alinhamento:
   - Primeiro em **flex-start** (canto superior esquerdo)
   - Depois em **flex-end** (canto superior direito)
   - Depois em **space-between** (distribuído)

**Resultado esperado**:
- [ ] flex-start: Elementos no lado esquerdo
- [ ] flex-end: Elementos no lado direito
- [ ] space-between: Elementos distribuídos com espaço

---

## Teste 12: Compatibilidade com Grid

**Objetivo**: Verificar se auto layout funciona com grid overlay

**Passos**:
1. Ative o **Grid Overlay** (aba Properties)
2. Ative o Auto Layout
3. Configure o layout
4. Observe a sobreposição

**Resultado esperado**:
- [ ] Grid fica visível por trás
- [ ] Auto layout funciona normalmente
- [ ] Sem conflitos visuais

---

## Teste 13: Compatibilidade com Raio X

**Objetivo**: Verificar se auto layout funciona com modo Raio X

**Passos**:
1. Ative **Raio X** na seção de Modo
2. Ative Auto Layout
3. Configure o layout

**Resultado esperado**:
- [ ] Modo Raio X mostra todas as camadas
- [ ] Auto layout funciona normalmente

---

## Teste 14: Edge Cases

**Objetivo**: Verificar comportamentos extremos

### Teste 14a: Sem Espaçamento
- Item Spacing: 0
- Resultado: Elementos comprimidos sem espaço

### Teste 14b: Padding Grande
- Padding: 100px
- Resultado: Elementos em espaço menor

### Teste 14c: Espaçamento Grande
- Item Spacing: 100px
- Resultado: Elementos muito afastados (possível overflow)

**Resultado esperado**: Nenhum erro, apenas comportamento extremo

---

## Teste 15: Performance

**Objetivo**: Verificar se não há lag ao ajustar valores

**Passos**:
1. Adicione ~20 elementos
2. Ative auto layout vertical
3. Mude o **Item Spacing** de 0 a 100 continuamente
4. Observe o desempenho

**Resultado esperado**:
- [ ] Atualizações em tempo real
- [ ] Sem stuttering visível
- [ ] Responsivo ao arrastar slider

---

## 📋 Checklist Final

- [ ] Todos os 15 testes passaram
- [ ] Sem erros no console
- [ ] Sem comportamentos inesperados
- [ ] Performance aceitável

## 🐛 Se Algo Falhar

Anote:
1. Qual teste falhou
2. O que você esperava
3. O que realmente aconteceu
4. Passos para reproduzir

---

## 📝 Notas

- Alguns erros TypeScript pré-existentes podem aparecer no console (não afetam funcionalidade)
- Auto layout só afeta elementos de nível superior (fora de frames)
- Elementos dentro de frames não são movidos pelo wireframe auto layout

