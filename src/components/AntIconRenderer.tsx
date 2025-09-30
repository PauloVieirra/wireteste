import React from 'react';
import * as AntIcons from '@ant-design/icons';

interface AntIconRendererProps {
  iconName: string;
  className?: string;
  style?: React.CSSProperties;
}

export function AntIconRenderer({ iconName, className, style }: AntIconRendererProps) {
  // Retrieve the icon component dynamically
  const IconComponent = (AntIcons as any)[iconName];
  
  if (!IconComponent) {
    // Fallback to a default icon if the specified icon is not found
    const FallbackIcon = AntIcons.QuestionCircleOutlined;
    return <FallbackIcon className={className} style={style} />;
  }
  
  return <IconComponent className={className} style={style} />;
}