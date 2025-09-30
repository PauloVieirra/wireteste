import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { 
  // Outlined Icons
  HomeOutlined, UserOutlined, SettingOutlined, SearchOutlined, HeartOutlined,
  StarOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined,
  ClockCircleOutlined, CameraOutlined, PictureOutlined, VideoCameraOutlined,
  CustomerServiceOutlined, DownloadOutlined, UploadOutlined, ShareAltOutlined,
  LinkOutlined, CopyOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  MinusOutlined, CloseOutlined, CheckOutlined, LeftOutlined, RightOutlined,
  UpOutlined, DownOutlined, MenuOutlined, EllipsisOutlined, FilterOutlined,
  BellOutlined, SafetyOutlined, LockOutlined, UnlockOutlined, EyeOutlined,
  EyeInvisibleOutlined, QuestionCircleOutlined, InfoCircleOutlined,
  ExclamationCircleOutlined, WarningOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SaveOutlined, ReloadOutlined, PoweroffOutlined,
  WifiOutlined, SoundOutlined, MutedOutlined, PlayCircleOutlined,
  PauseCircleOutlined, StepBackwardOutlined, StepForwardOutlined,
  ShoppingCartOutlined, CreditCardOutlined, DollarOutlined, RiseOutlined,
  FallOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined,
  BookOutlined, FlagOutlined, TagOutlined, PaperClipOutlined, FileOutlined,
  FolderOutlined, AppstoreOutlined, UnorderedListOutlined, LayoutOutlined,
  TableOutlined, SmileOutlined, FrownOutlined, MehOutlined, DatabaseOutlined,
  CloudOutlined, TeamOutlined, MessageOutlined, CommentOutlined, LikeOutlined,
  DislikeOutlined, ThunderboltOutlined, BugOutlined, CodeOutlined, ApiOutlined,
  GlobalOutlined, FireOutlined, TrophyOutlined, GiftOutlined, RocketOutlined,
  BulbOutlined, CarOutlined, ShopOutlined, BankOutlined, MedicineBoxOutlined,
  PrinterOutlined, ScannerOutlined, QrcodeOutlined, BarcodeOutlined, KeyOutlined,
  DashboardOutlined, ControlOutlined, ToolOutlined, DesktopOutlined, MobileOutlined,
  TabletOutlined, LaptopOutlined, SendOutlined, InboxOutlined, SwapOutlined,
  SyncOutlined, UndoOutlined, RedoOutlined, ZoomInOutlined, ZoomOutOutlined,
  FullscreenOutlined, CompressOutlined, ExpandOutlined, SelectOutlined,
  ClearOutlined, FormOutlined, OrderedListOutlined, FontSizeOutlined,
  BoldOutlined, ItalicOutlined, UnderlineOutlined, StrikethroughOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined, FontColorsOutlined,
  HighlightOutlined,
  // Filled Icons
  HomeFilled, UserFilled, SettingFilled, HeartFilled, StarFilled, MailFilled,
  PhoneFilled, EnvironmentFilled, CalendarFilled, ClockCircleFilled, CameraFilled,
  PictureFilled, VideoCameraFilled, CustomerServiceFilled, DownloadFilled,
  UploadFilled, ShareAltFilled, LinkFilled, CopyFilled, EditFilled, DeleteFilled,
  PlusFilled, BellFilled, SafetyFilled, LockFilled, UnlockFilled, EyeFilled,
  EyeInvisibleFilled, QuestionCircleFilled, InfoCircleFilled,
  ExclamationCircleFilled, WarningFilled, CheckCircleFilled, CloseCircleFilled,
  SaveFilled, ReloadFilled, PoweroffFilled, WifiFilled, SoundFilled, MutedFilled,
  PlayCircleFilled, PauseCircleFilled, StepBackwardFilled, StepForwardFilled,
  ShoppingCartFilled, CreditCardFilled, DollarFilled, RiseFilled, FallFilled,
  BarChartFilled, PieChartFilled, LineChartFilled, BookFilled, FlagFilled,
  TagFilled, PaperClipFilled, FileFilled, FolderFilled, AppstoreFilled,
  UnorderedListFilled, LayoutFilled, TableFilled, SmileFilled, FrownFilled,
  MehFilled, DatabaseFilled, CloudFilled, TeamFilled, MessageFilled,
  CommentFilled, LikeFilled, DislikeFilled, ThunderboltFilled, BugFilled,
  ApiFilled, GlobalFilled, FireFilled, TrophyFilled, GiftFilled, RocketFilled,
  BulbFilled
} from '@ant-design/icons';

// Ícones mais comuns organizados por categoria
const sidebarIconLibrary = {
  navigation: [
    { name: 'HomeOutlined', icon: HomeOutlined },
    { name: 'MenuOutlined', icon: MenuOutlined },
    { name: 'LeftOutlined', icon: LeftOutlined },
    { name: 'RightOutlined', icon: RightOutlined },
    { name: 'UpOutlined', icon: UpOutlined },
    { name: 'DownOutlined', icon: DownOutlined },
    { name: 'SearchOutlined', icon: SearchOutlined },
    { name: 'FilterOutlined', icon: FilterOutlined },
  ],
  
  social: [
    { name: 'UserOutlined', icon: UserOutlined },
    { name: 'TeamOutlined', icon: TeamOutlined },
    { name: 'HeartOutlined', icon: HeartOutlined },
    { name: 'StarOutlined', icon: StarOutlined },
    { name: 'LikeOutlined', icon: LikeOutlined },
    { name: 'MessageOutlined', icon: MessageOutlined },
    { name: 'CommentOutlined', icon: CommentOutlined },
    { name: 'ShareAltOutlined', icon: ShareAltOutlined },
  ],
  
  communication: [
    { name: 'MailOutlined', icon: MailOutlined },
    { name: 'PhoneOutlined', icon: PhoneOutlined },
    { name: 'BellOutlined', icon: BellOutlined },
    { name: 'SendOutlined', icon: SendOutlined },
    { name: 'InboxOutlined', icon: InboxOutlined },
    { name: 'CustomerServiceOutlined', icon: CustomerServiceOutlined },
    { name: 'GlobalOutlined', icon: GlobalOutlined },
  ],
  
  media: [
    { name: 'CameraOutlined', icon: CameraOutlined },
    { name: 'PictureOutlined', icon: PictureOutlined },
    { name: 'VideoCameraOutlined', icon: VideoCameraOutlined },
    { name: 'PlayCircleOutlined', icon: PlayCircleOutlined },
    { name: 'PauseCircleOutlined', icon: PauseCircleOutlined },
    { name: 'SoundOutlined', icon: SoundOutlined },
    { name: 'MutedOutlined', icon: MutedOutlined },
  ],
  
  actions: [
    { name: 'PlusOutlined', icon: PlusOutlined },
    { name: 'EditOutlined', icon: EditOutlined },
    { name: 'DeleteOutlined', icon: DeleteOutlined },
    { name: 'CopyOutlined', icon: CopyOutlined },
    { name: 'SaveOutlined', icon: SaveOutlined },
    { name: 'DownloadOutlined', icon: DownloadOutlined },
    { name: 'UploadOutlined', icon: UploadOutlined },
    { name: 'ReloadOutlined', icon: ReloadOutlined },
  ],
  
  system: [
    { name: 'SettingOutlined', icon: SettingOutlined },
    { name: 'SafetyOutlined', icon: SafetyOutlined },
    { name: 'LockOutlined', icon: LockOutlined },
    { name: 'EyeOutlined', icon: EyeOutlined },
    { name: 'PoweroffOutlined', icon: PoweroffOutlined },
    { name: 'WifiOutlined', icon: WifiOutlined },
  ],
  
  status: [
    { name: 'InfoCircleOutlined', icon: InfoCircleOutlined },
    { name: 'QuestionCircleOutlined', icon: QuestionCircleOutlined },
    { name: 'ExclamationCircleOutlined', icon: ExclamationCircleOutlined },
    { name: 'CheckCircleOutlined', icon: CheckCircleOutlined },
    { name: 'CloseCircleOutlined', icon: CloseCircleOutlined },
    { name: 'WarningOutlined', icon: WarningOutlined },
  ],
  
  business: [
    { name: 'ShoppingCartOutlined', icon: ShoppingCartOutlined },
    { name: 'CreditCardOutlined', icon: CreditCardOutlined },
    { name: 'DollarOutlined', icon: DollarOutlined },
    { name: 'BankOutlined', icon: BankOutlined },
    { name: 'TrophyOutlined', icon: TrophyOutlined },
    { name: 'GiftOutlined', icon: GiftOutlined },
  ],
  
  charts: [
    { name: 'BarChartOutlined', icon: BarChartOutlined },
    { name: 'PieChartOutlined', icon: PieChartOutlined },
    { name: 'LineChartOutlined', icon: LineChartOutlined },
    { name: 'DashboardOutlined', icon: DashboardOutlined },
  ],
  
  organization: [
    { name: 'CalendarOutlined', icon: CalendarOutlined },
    { name: 'ClockCircleOutlined', icon: ClockCircleOutlined },
    { name: 'BookOutlined', icon: BookOutlined },
    { name: 'FolderOutlined', icon: FolderOutlined },
    { name: 'FileOutlined', icon: FileOutlined },
    { name: 'TagOutlined', icon: TagOutlined },
  ],
};

interface IconsSidebarProps {
  onIconDragStart?: (iconName: string, IconComponent: React.ComponentType<any>) => void;
}

export function IconsSidebar({ onIconDragStart }: IconsSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Memoizar os ícones filtrados para performance
  const filteredIcons = useMemo(() => {
    let allIcons: Array<{ name: string; icon: React.ComponentType<any>; category: string }> = [];
    
    // Combinar todos os ícones com suas categorias
    Object.entries(sidebarIconLibrary).forEach(([category, icons]) => {
      icons.forEach(icon => {
        allIcons.push({ ...icon, category });
      });
    });
    
    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      allIcons = allIcons.filter(icon => icon.category === selectedCategory);
    }
    
    // Filtrar por busca
    if (searchTerm) {
      allIcons = allIcons.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return allIcons;
  }, [searchTerm, selectedCategory]);

  const handleDragStart = (e: React.DragEvent, iconName: string, IconComponent: React.ComponentType<any>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'icon',
      iconName,
      iconComponent: iconName
    }));
    
    if (onIconDragStart) {
      onIconDragStart(iconName, IconComponent);
    }
  };

  const categories = [
    { id: 'all', name: 'Todos', count: Object.values(sidebarIconLibrary).flat().length },
    { id: 'navigation', name: 'Navegação', count: sidebarIconLibrary.navigation.length },
    { id: 'social', name: 'Social', count: sidebarIconLibrary.social.length },
    { id: 'communication', name: 'Comunicação', count: sidebarIconLibrary.communication.length },
    { id: 'media', name: 'Mídia', count: sidebarIconLibrary.media.length },
    { id: 'actions', name: 'Ações', count: sidebarIconLibrary.actions.length },
    { id: 'system', name: 'Sistema', count: sidebarIconLibrary.system.length },
    { id: 'status', name: 'Status', count: sidebarIconLibrary.status.length },
    { id: 'business', name: 'Negócios', count: sidebarIconLibrary.business.length },
    { id: 'charts', name: 'Gráficos', count: sidebarIconLibrary.charts.length },
    { id: 'organization', name: 'Organização', count: sidebarIconLibrary.organization.length },
  ];

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div>
        <Label htmlFor="sidebar-icon-search" className="text-sm">Buscar ícones</Label>
        <Input
          id="sidebar-icon-search"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1 h-8"
        />
      </div>
      
      {/* Filtro rápido por categoria */}
      <div>
        <Label className="text-sm">Categoria</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {categories.slice(0, 6).map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="h-6 px-2 text-xs"
            >
              {category.name}
              <Badge variant="secondary" className="ml-1 text-xs px-1">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Contador de resultados */}
      <div className="text-xs text-muted-foreground">
        {filteredIcons.length} ícones
      </div>
      
      {/* Grid de Ícones */}
      <ScrollArea className="h-64">
        <div className="grid grid-cols-6 gap-1">
          {filteredIcons.map((iconData, index) => {
            const IconComponent = iconData.icon;
            return (
              <div
                key={`${iconData.category}-${iconData.name}-${index}`}
                className="group relative"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 flex flex-col gap-1 cursor-move group-hover:border-primary transition-colors"
                  onDragStart={(e) => handleDragStart(e, iconData.name, IconComponent)}
                  draggable
                  title={`${iconData.name} (${iconData.category})`}
                >
                  <IconComponent className="w-4 h-4 text-current" />
                </Button>
              </div>
            );
          })}
        </div>
        
        {filteredIcons.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <SearchOutlined className="w-8 h-8 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Nenhum ícone encontrado</p>
          </div>
        )}
      </ScrollArea>
      
      {/* Link para biblioteca completa */}
      <div className="text-xs text-muted-foreground text-center border-t pt-2">
        <span>💡 Arraste os ícones para o wireframe</span>
      </div>
    </div>
  );
}