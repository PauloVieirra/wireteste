# Fix: FillContainer Respect Borders in All Resolutions

## Problema
Ao usar `fillContainer` em um frame, o elemento não estava respeitando as bordas do wireframe, especialmente em resoluções mobile e tablet. O elemento preenchia o container inteiramente, sobrepondo as bordas do frame.

## Causas Identificadas
1. A função `fillContainer` não considerava `borderWidth` ao calcular as dimensões disponíveis
2. A função `handleElementTransformEnd` também não considerava `borderWidth` ao fazer clamping de posição e tamanho

## Solução Implementada

### 1. Função `fillContainer` (WireframeEditor.tsx - linhas 449-497)
Adicionada consideração de `borderWidth` ao cálculo de espaço disponível:

**Antes:**
```typescript
const parentPadding = parent ? (parent.padding || 0) : 0;

if (axis === 'horizontal') {
    const parentWidth = parent ? parent.width : canvasDimensions.width;
    propertiesToUpdate.x = parent ? parentPadding : 0;
    const newWidth = parent ? parentWidth - (parentPadding * 2) : parentWidth;
    propertiesToUpdate.width = Math.max(24, newWidth);
}
```

**Depois:**
```typescript
const parentPadding = parent ? (parent.padding || 0) : 0;
const parentBorderWidth = parent ? (parent.borderWidth || 0) : 0;

if (axis === 'horizontal') {
    const parentWidth = parent ? parent.width : canvasDimensions.width;
    // Account for parent padding and border width
    propertiesToUpdate.x = parent ? parentPadding + parentBorderWidth : 0;
    const newWidth = parent 
        ? parentWidth - (parentPadding * 2) - (parentBorderWidth * 2)
        : parentWidth;
    propertiesToUpdate.width = Math.max(24, newWidth);
}
```

**Mesma lógica aplicada para `axis === 'vertical'`**

### 2. Função `handleElementTransformEnd` (WireframeEditor.tsx - linhas 1508-1532)
Adicionada consideração de `borderWidth` ao fazer clamping de posição e tamanho:

**Antes:**
```typescript
let container = { x: 0, y: 0, width: canvasDimensions.width, height: canvasDimensions.height, padding: 0 };

if (parentFrame) {
    container = {
        x: parentAbsPos.x,
        y: parentAbsPos.y,
        width: parentFrame.width,
        height: parentFrame.height,
        padding: parentFrame.padding || 0
    };
}

// Clamp width and height
finalWidth = Math.min(finalWidth, container.width - container.padding * 2);
finalHeight = Math.min(finalHeight, container.height - container.padding * 2);

// Clamp position
finalX = Math.max(container.x + container.padding, Math.min(finalX, container.x + container.width - finalWidth - container.padding));
finalY = Math.max(container.y + container.padding, Math.min(finalY, container.y + container.height - finalHeight - container.padding));
```

**Depois:**
```typescript
let container = { x: 0, y: 0, width: canvasDimensions.width, height: canvasDimensions.height, padding: 0, borderWidth: 0 };

if (parentFrame) {
    container = {
        x: parentAbsPos.x,
        y: parentAbsPos.y,
        width: parentFrame.width,
        height: parentFrame.height,
        padding: parentFrame.padding || 0,
        borderWidth: parentFrame.borderWidth || 0
    };
}

// Clamp width and height, accounting for both padding and border width to keep borders visible
finalWidth = Math.min(finalWidth, container.width - container.padding * 2 - container.borderWidth * 2);
finalHeight = Math.min(finalHeight, container.height - container.padding * 2 - container.borderWidth * 2);

// Clamp position, accounting for both padding and border width
finalX = Math.max(container.x + container.padding + container.borderWidth, Math.min(finalX, container.x + container.width - finalWidth - container.padding - container.borderWidth));
finalY = Math.max(container.y + container.padding + container.borderWidth, Math.min(finalY, container.y + container.height - finalHeight - container.padding - container.borderWidth));
```

## Impacto
- ✅ Elementos com `fillContainer` agora respeitam as bordas do frame em **todas as resoluções** (mobile, tablet, desktop)
- ✅ Elementos arrastados/redimensionados também respeitam as bordas
- ✅ Mantém a lógica de padding do frame
- ✅ Compatível com diferentes valores de `borderWidth` (padrão é 2 para frames)

## Fórmula de Cálculo
Para um frame com as seguintes propriedades:
- `width`: largura total do frame
- `height`: altura total do frame  
- `padding`: espaçamento interno
- `borderWidth`: espessura da borda

O espaço disponível para elementos filhos agora é:
```
espaço_horizontal = width - (padding * 2) - (borderWidth * 2)
espaço_vertical = height - (padding * 2) - (borderWidth * 2)

posição_x_mínima = x + padding + borderWidth
posição_y_mínima = y + padding + borderWidth
```

## Testes Recomendados
1. Criar frame mobile com borda de 2px
2. Adicionar elemento e aplicar "Fill Horizontally" / "Fill Vertically"
3. Verificar se as bordas do frame permanecem visíveis
4. Repetir para tablet e desktop
5. Testar com diferentes valores de `borderWidth` (1, 2, 4)
6. Arrastar e redimensionar elementos para verificar clamping
