# Funcionalidade de Desfazer (Undo) - Implementação Completa

## Descrição
A funcionalidade de **desfazer (Undo)** foi implementada no wireframe editor com as seguintes características:

### ✅ Funcionalidades
1. **Atalho de Teclado**: Pressione `Ctrl+Z` (ou `Cmd+Z` no Mac) para desfazer a última ação
2. **Botão na Toolbar**: Um botão "Desfazer" visível na barra de ferramentas superior
3. **Limite de 6 Ações**: O histórico mantém apenas as 6 últimas ações, economizando memória
4. **Feedback Visual**: 
   - O botão é desabilitado (disabled) quando não há ações para desfazer
   - Um toast notifica quando a ação é desfeita
5. **Suporte Multiplataforma**: Funciona com `Ctrl+Z` (Windows/Linux) e `Cmd+Z` (Mac)

## Como Funciona

### Hook `useUndoHistory`
O hook customizado em `src/hooks/useUndoHistory.ts` gerencia o histórico de estados:

```typescript
const { state, setState, undo, redo, canUndo, canRedo } = useUndoHistory<Project>(project, 6);
```

**Parâmetros:**
- `initialState`: Estado inicial (Project)
- `maxHistory`: Número máximo de estados no histórico (padrão: 6)

**Retorna:**
- `state`: Estado atual
- `setState`: Função para atualizar o estado (adiciona ao histórico)
- `undo`: Função para desfazer última ação
- `redo`: Função para refazer ação (não implementada na toolbar ainda)
- `canUndo`: Boolean indicando se há ações para desfazer
- `canRedo`: Boolean indicando se há ações para refazer

### Integração no WireframeEditor
O `useUndoHistory` é inicializado no início do componente:

```typescript
const { state: internalProject, setState: setInternalProject, undo, canUndo } = useUndoHistory<Project>(project, 6);
```

Todos os `setInternalProject()` chamados automaticamente adicionam um novo estado ao histórico.

### Listener de Teclado
Um `useEffect` escuta por `Ctrl+Z`:

```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      if (canUndo) {
        undo();
        showToast('Ação desfeita', 'info');
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [canUndo, undo, showToast]);
```

### Botão na Toolbar
Adicionado um botão visual na barra de ferramentas com ícone de desfazer:

```typescript
<Button 
  variant="outline" 
  size="sm" 
  onClick={undo}
  disabled={!canUndo}
  title="Desfazer (Ctrl+Z)"
>
  <svg>...</svg>
</Button>
```

## Ações Rastreadas
O histórico rastreia automaticamente qualquer mudança feita através de `setInternalProject()`, incluindo:

- Adicionar/remover wireframes
- Adicionar/remover elementos
- Modificar propriedades de elementos (cor, tamanho, posição, etc.)
- Editar imagens (crop, modo de exibição)
- Modificar layout (padding, Auto Layout)
- Qualquer outra alteração no projeto

## Limitações
1. **Máximo 6 ações**: O histórico é limitado a 6 estados para economizar memória
2. **Não persiste**: O histórico é perdido ao recarregar a página (mantém apenas em memória)
3. **Sem Redo**: A funcionalidade de refazer (Redo) não está implementada na toolbar (pode ser adicionada com `Ctrl+Y`)
4. **Não salva automaticamente**: O desfazer não afeta o save status

## Arquivos Modificados
- `src/hooks/useUndoHistory.ts` - Hook para gerenciar histórico
- `src/components/WireframeEditor.tsx` - Integração do hook e listener de teclado

## Exemplos de Uso

### Desfazer com Atalho
1. Faça qualquer alteração no wireframe
2. Pressione `Ctrl+Z` (Windows/Linux) ou `Cmd+Z` (Mac)
3. Verá um toast "Ação desfeita" e a ação será revertida

### Desfazer com Botão
1. Clique no botão "Desfazer" na toolbar (ícone de seta circular para a esquerda)
2. A ação será revertida imediatamente
3. O botão fica desabilitado quando não há ações para desfazer

## Próximos Passos (Opcional)
1. Implementar **Redo** com `Ctrl+Y` ou `Cmd+Y`
2. Persistir o histórico em localStorage
3. Mostrar indicador visual do número de ações no histórico
4. Adicionar `Ctrl+Shift+Z` para redo
