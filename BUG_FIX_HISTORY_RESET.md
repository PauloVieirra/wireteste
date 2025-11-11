# Correção - Bug de Revert de Mudanças

## Problema Identificado

Você relatou que:
- Ao excluir elemento, ele reaparecia
- Ao mover elemento, retornava ao lugar
- Ao mudar cor, retornava à cor inicial
- Auto-layout organizava elementos mas voltavam ao lugar

**Causa Raiz**: O hook `useUndoHistory` estava sendo resetado a cada render

## Análise Técnica

### O Bug

No `WireframeEditor.tsx` linha 182, você tinha:

```tsx
const { state: internalProject, setState: setInternalProject, undo, canUndo } = 
  useUndoHistory<Project>(normalizeWireframesDimensions(project), 6);
```

**O problema:**
1. `normalizeWireframesDimensions(project)` é uma função que **cria um novo objeto** a cada render
2. Mesmo que `project` prop não mude, a função retorna um novo objeto (referência diferente)
3. O `useUndoHistory` tem um `useEffect` que depende de `initialState`
4. Quando `initialState` muda (comparação de referência), o effect reseta o history inteiro: `past = [], present = initialState, future = []`
5. Isso significa que **toda vez que o componente renderiza, o history é resetado**
6. Portanto, qualquer mudança que você faz é imediatamente "desfeita" quando o componente renderiza novamente

### A Solução

Memoizar `normalizeWireframesDimensions(project)` com `useMemo`:

```tsx
// ANTES (BUGADO):
const { state: internalProject, setState: setInternalProject, undo, canUndo } = 
  useUndoHistory<Project>(normalizeWireframesDimensions(project), 6);

// DEPOIS (CORRIGIDO):
const normalizedProject = useMemo(() => normalizeWireframesDimensions(project), [project]);
const { state: internalProject, setState: setInternalProject, undo, canUndo } = 
  useUndoHistory<Project>(normalizedProject, 6);
```

Agora:
- `normalizedProject` é recalculado **apenas quando `project` muda**
- Não há novo objeto criado a cada render
- O `useEffect` no hook só reseta history quando a prop `project` realmente muda
- Mudanças locais (excluir, mover, colorir elementos) **persistem** no history

### Bônus: Sincronização com localStorage

Também corrigimos comparações para usar `normalizedProject` em vez de `project`:

```tsx
// ANTES:
if (JSON.stringify(localProject.wireframes) !== JSON.stringify(project.wireframes))

// DEPOIS:
if (JSON.stringify(localProject.wireframes) !== JSON.stringify(normalizedProject.wireframes))
```

Isso garante que a normalização seja consistente em todas as comparações.

## Teste

Para verificar que o bug foi corrigido:

1. **Crie um elemento** - deve aparecer na tela ✓
2. **Mude a cor do elemento** - a cor deve permanecer ✓
3. **Mova o elemento** - deve ficar na nova posição ✓
4. **Exclua o elemento** - deve desaparecer (não reaparece) ✓
5. **Ative Auto Layout** - elementos devem se reorganizar e **manter a nova posição** ✓
6. **Pressione Ctrl+Z** - deve desfazer a última ação (não desfazer tudo) ✓

## Mudanças Realizadas

- ✅ Adicionado `useMemo` ao import
- ✅ Criado `normalizedProject` memoizado
- ✅ Usado `normalizedProject` no `useUndoHistory`
- ✅ Sincronizadas comparações de localStorage para usar `normalizedProject`
- ✅ Removidos todos os `console.log` de debug

## Impacto

**Antes**: Qualquer mudança era revertida automaticamente
**Depois**: Mudanças persistem, undo/redo funcionam corretamente, auto-layout funciona
