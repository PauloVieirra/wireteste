import { useCallback } from 'react';
import { WireframeElement, Wireframe } from '../types';

export interface AutoLayoutConfig {
  layoutMode?: 'none' | 'horizontal' | 'vertical';
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
}

export const useWireframeAutoLayout = () => {
  const calculateAutoLayout = useCallback((wireframe: Wireframe, wireframeConfig: AutoLayoutConfig) => {
    // If auto layout is disabled, return elements as is
    if (!wireframeConfig.layoutMode || wireframeConfig.layoutMode === 'none') {
      return wireframe.elements;
    }

    // If no elements, return empty
    if (!wireframe.elements || wireframe.elements.length === 0) {
      return wireframe.elements;
    }

    // If wireframe dimensions are not set, calculate from elements
    let width = wireframe.width;
    let height = wireframe.height;
    
    if (!width || !height) {
      // Calculate bounding box from elements
      if (wireframe.elements.length > 0) {
        const maxX = Math.max(...wireframe.elements.map(el => el.x + el.width), 0);
        const maxY = Math.max(...wireframe.elements.map(el => el.y + el.height), 0);
        width = width || maxX || 800;
        height = height || maxY || 600;
      } else {
        width = width || 800;
        height = height || 600;
      }
    }

    // Ensure minimum dimensions
    width = Math.max(width, 100);
    height = Math.max(height, 100);

    const pTop = wireframeConfig.paddingTop ?? 0;
    const pRight = wireframeConfig.paddingRight ?? 0;
    const pBottom = wireframeConfig.paddingBottom ?? 0;
    const pLeft = wireframeConfig.paddingLeft ?? 0;
    const spacing = wireframeConfig.itemSpacing ?? 0;
    const justifyContent = wireframeConfig.justifyContent ?? 'flex-start';
    const alignItems = wireframeConfig.alignItems ?? 'flex-start';

    const availableWidth = width - pLeft - pRight;
    const availableHeight = height - pTop - pBottom;

    // Ensure available dimensions are positive
    if (availableWidth <= 0 || availableHeight <= 0) {
      return wireframe.elements;
    }

    // All elements at wireframe level should be laid out
    // (Frames can have child elements, but that doesn't prevent them from being positioned in the wireframe layout)
    const elementsToLayout = wireframe.elements;

    let layoutElements: WireframeElement[];

    if (wireframeConfig.layoutMode === 'horizontal') {
      layoutElements = calculateHorizontalLayout(
        elementsToLayout,
        availableWidth,
        availableHeight,
        pTop,
        pLeft,
        spacing,
        justifyContent,
        alignItems
      );
    } else if (wireframeConfig.layoutMode === 'vertical') {
      layoutElements = calculateVerticalLayout(
        elementsToLayout,
        availableWidth,
        availableHeight,
        pTop,
        pLeft,
        spacing,
        justifyContent,
        alignItems
      );
    } else {
      layoutElements = elementsToLayout;
    }

    // Return the layout-applied elements
    return layoutElements;
  }, []);

  const calculateHorizontalLayout = (
    elements: WireframeElement[],
    availableWidth: number,
    availableHeight: number,
    pTop: number,
    pLeft: number,
    spacing: number,
    justifyContent: string,
    alignItems: string
  ): WireframeElement[] => {
    if (elements.length === 0) {
      return elements;
    }

    // Calculate total width needed
    const totalElementsWidth = elements.reduce((sum, el) => sum + el.width, 0);
    const totalSpacingWidth = spacing * (elements.length - 1);
    const totalWidth = totalElementsWidth + totalSpacingWidth;

    let currentX = pLeft;

    // Apply justify-content
    if (justifyContent === 'center') {
      currentX = pLeft + (availableWidth - totalWidth) / 2;
    } else if (justifyContent === 'flex-end') {
      currentX = pLeft + (availableWidth - totalWidth);
    } else if (justifyContent === 'space-between' && elements.length > 1) {
      // Handle space-between separately
      return elements.map((el, index) => {
        const position = (availableWidth - totalElementsWidth) / (elements.length - 1);
        const x = pLeft + index * position;
        const y = calculateVerticalPosition(el, availableHeight, pTop, alignItems);
        return { ...el, x: Math.round(x), y: Math.round(y) };
      });
    }

    const result = elements.map((el, index) => {
      const x = currentX;
      const y = calculateVerticalPosition(el, availableHeight, pTop, alignItems);
      currentX += el.width + spacing;
      return { ...el, x: Math.round(x), y: Math.round(y) };
    });
    return result;
  };

  const calculateVerticalLayout = (
    elements: WireframeElement[],
    availableWidth: number,
    availableHeight: number,
    pTop: number,
    pLeft: number,
    spacing: number,
    justifyContent: string,
    alignItems: string
  ): WireframeElement[] => {
    if (elements.length === 0) return elements;

    // Calculate total height needed
    const totalElementsHeight = elements.reduce((sum, el) => sum + el.height, 0);
    const totalSpacingHeight = spacing * (elements.length - 1);
    const totalHeight = totalElementsHeight + totalSpacingHeight;

    let currentY = pTop;

    // Apply justify-content
    if (justifyContent === 'center') {
      currentY = pTop + (availableHeight - totalHeight) / 2;
    } else if (justifyContent === 'flex-end') {
      currentY = pTop + (availableHeight - totalHeight);
    } else if (justifyContent === 'space-between' && elements.length > 1) {
      // Handle space-between separately
      return elements.map((el, index) => {
        const position = (availableHeight - totalElementsHeight) / (elements.length - 1);
        const y = pTop + index * position;
        const x = calculateHorizontalPosition(el, availableWidth, pLeft, alignItems);
        return { ...el, x: Math.round(x), y: Math.round(y) };
      });
    }

    return elements.map((el, index) => {
      const y = currentY;
      const x = calculateHorizontalPosition(el, availableWidth, pLeft, alignItems);
      currentY += el.height + spacing;
      return { ...el, x: Math.round(x), y: Math.round(y) };
    });
  };

  const calculateHorizontalPosition = (
    element: WireframeElement,
    availableWidth: number,
    pLeft: number,
    alignItems: string
  ): number => {
    switch (alignItems) {
      case 'center':
        return pLeft + (availableWidth - element.width) / 2;
      case 'flex-end':
        return pLeft + (availableWidth - element.width);
      case 'flex-start':
      default:
        return pLeft;
    }
  };

  const calculateVerticalPosition = (
    element: WireframeElement,
    availableHeight: number,
    pTop: number,
    alignItems: string
  ): number => {
    switch (alignItems)
    {
      case 'center':
        return pTop + (availableHeight - element.height) / 2;
      case 'flex-end':
        return pTop + (availableHeight - element.height);
      case 'flex-start':
      default:
        return pTop;
    }
  };

  return { calculateAutoLayout };
};
