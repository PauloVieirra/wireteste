import React, { Suspense } from 'react';
import { iconIndex } from './icon-index';
import { Star } from 'lucide-react'; // Keep Star for fallback

interface LucideIconRendererProps {
  iconName: string;
  style?: React.CSSProperties;
  className?: string;
}

export function LucideIconRenderer({ iconName, style, className }: LucideIconRendererProps) {
  const IconComponent = iconIndex[iconName];
  console.log(`LucideIconRenderer: iconName=${iconName}, IconComponent=${IconComponent}`);

  if (!IconComponent) {
    // Fallback to a default icon if the specified icon is not found in iconIndex
    return (
      <div style={style} className={className}>
        <Star className="w-full h-full" />
      </div>
    );
  }

  return (
    <div style={style} className={className}>
      <Suspense fallback={<div>Carregando ícone...</div>}> {/* Add a loading fallback for lazy components */}
        <IconComponent className="w-full h-full" />
      </Suspense>
    </div>
  );
}