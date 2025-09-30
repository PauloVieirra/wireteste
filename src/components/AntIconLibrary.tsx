import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
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
  WifiOutlined, BatteryTwoToneOutlined, SoundOutlined, MutedOutlined,
  PlayCircleOutlined, PauseCircleOutlined, StepBackwardOutlined,
  StepForwardOutlined, ShoppingCartOutlined, CreditCardOutlined,
  DollarOutlined, RiseOutlined, FallOutlined, BarChartOutlined,
  PieChartOutlined, LineChartOutlined, BookOutlined, FlagOutlined,
  TagOutlined, PaperClipOutlined, FileOutlined, FolderOutlined,
  AppstoreOutlined, UnorderedListOutlined, LayoutOutlined, TableOutlined,
  BorderOutlined, BorderlessTableOutlined, SmileOutlined, FrownOutlined,
  MehOutlined, DatabaseOutlined, CloudOutlined, TeamOutlined, MessageOutlined,
  CommentOutlined, LikeOutlined, DislikeOutlined, ThunderboltOutlined,
  BugOutlined, CodeOutlined, ApiOutlined, GlobalOutlined, TranslationOutlined,
  FireOutlined, TrophyOutlined, GiftOutlined, RocketOutlined, BulbOutlined,
  CarOutlined, ShopOutlined, BankOutlined, HomeOutlined as BuildingOutlined,
  MedicineBoxOutlined, BookOutlined as ReadOutlined, PrinterOutlined,
  ScannerOutlined, QrcodeOutlined, BarcodeOutlined, KeyOutlined,
  DashboardOutlined, ControlOutlined, ToolOutlined, BugOutlined as FixOutlined,
  DesktopOutlined, MobileOutlined, TabletOutlined, LaptopOutlined,
  SendOutlined, InboxOutlined, SwapOutlined, SyncOutlined, UndoOutlined,
  RedoOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined,
  CompressOutlined, ExpandOutlined, SelectOutlined, ClearOutlined,
  FormOutlined, OrderedListOutlined, FontSizeOutlined, BoldOutlined,
  ItalicOutlined, UnderlineOutlined, StrikethroughOutlined, AlignLeftOutlined,
  AlignCenterOutlined, AlignRightOutlined, FontColorsOutlined, HighlightOutlined,
  // Filled Icons
  HomeFilled, UserFilled, SettingFilled, SearchFilled, HeartFilled,
  StarFilled, MailFilled, PhoneFilled, EnvironmentFilled, CalendarFilled,
  ClockCircleFilled, CameraFilled, PictureFilled, VideoCameraFilled,
  CustomerServiceFilled, DownloadFilled, UploadFilled, ShareAltFilled,
  LinkFilled, CopyFilled, EditFilled, DeleteFilled, PlusFilled,
  MinusFilled, CloseFilled, CheckFilled, LeftFilled, RightFilled,
  UpFilled, DownFilled, MenuFilled, EllipsisFilled, FilterFilled,
  BellFilled, SafetyFilled, LockFilled, UnlockFilled, EyeFilled,
  EyeInvisibleFilled, QuestionCircleFilled, InfoCircleFilled,
  ExclamationCircleFilled, WarningFilled, CheckCircleFilled,
  CloseCircleFilled, SaveFilled, ReloadFilled, PoweroffFilled,
  WifiFilled, BatteryTwoTone, SoundFilled, MutedFilled,
  PlayCircleFilled, PauseCircleFilled, StepBackwardFilled,
  StepForwardFilled, ShoppingCartFilled, CreditCardFilled,
  DollarFilled, RiseFilled, FallFilled, BarChartFilled,
  PieChartFilled, LineChartFilled, BookFilled, FlagFilled,
  TagFilled, PaperClipFilled, FileFilled, FolderFilled,
  AppstoreFilled, UnorderedListFilled, LayoutFilled, TableFilled,
  BorderFilled, BorderlessTableFilled, SmileFilled, FrownFilled,
  MehFilled, DatabaseFilled, CloudFilled, TeamFilled, MessageFilled,
  CommentFilled, LikeFilled, DislikeFilled, ThunderboltFilled,
  BugFilled, CodeFilled, ApiFilled, GlobalFilled, TranslationFilled,
  FireFilled, TrophyFilled, GiftFilled, RocketFilled, BulbFilled
} from '@ant-design/icons';

// Definir a estrutura dos ícones com categorias
const antIconLibrary = {
  // Navegação e Interface
  navigation: [
    { name: 'HomeOutlined', icon: HomeOutlined },
    { name: 'HomeFilled', icon: HomeFilled },
    { name: 'MenuOutlined', icon: MenuOutlined },
    { name: 'MenuFilled', icon: MenuFilled },
    { name: 'LeftOutlined', icon: LeftOutlined },
    { name: 'RightOutlined', icon: RightOutlined },
    { name: 'UpOutlined', icon: UpOutlined },
    { name: 'DownOutlined', icon: DownOutlined },
    { name: 'EllipsisOutlined', icon: EllipsisOutlined },
    { name: 'CloseOutlined', icon: CloseOutlined },
    { name: 'CheckOutlined', icon: CheckOutlined },
    { name: 'SearchOutlined', icon: SearchOutlined },
    { name: 'FilterOutlined', icon: FilterOutlined },
  ],

  // Usuário e Social
  social: [
    { name: 'UserOutlined', icon: UserOutlined },
    { name: 'UserFilled', icon: UserFilled },
    { name: 'TeamOutlined', icon: TeamOutlined },
    { name: 'TeamFilled', icon: TeamFilled },
    { name: 'HeartOutlined', icon: HeartOutlined },
    { name: 'HeartFilled', icon: HeartFilled },
    { name: 'StarOutlined', icon: StarOutlined },
    { name: 'StarFilled', icon: StarFilled },
    { name: 'LikeOutlined', icon: LikeOutlined },
    { name: 'LikeFilled', icon: LikeFilled },
    { name: 'DislikeOutlined', icon: DislikeOutlined },
    { name: 'DislikeFilled', icon: DislikeFilled },
    { name: 'MessageOutlined', icon: MessageOutlined },
    { name: 'MessageFilled', icon: MessageFilled },
    { name: 'CommentOutlined', icon: CommentOutlined },
    { name: 'CommentFilled', icon: CommentFilled },
    { name: 'ShareAltOutlined', icon: ShareAltOutlined },
    { name: 'ShareAltFilled', icon: ShareAltFilled },
  ],

  // Comunicação
  communication: [
    { name: 'MailOutlined', icon: MailOutlined },
    { name: 'MailFilled', icon: MailFilled },
    { name: 'PhoneOutlined', icon: PhoneOutlined },
    { name: 'PhoneFilled', icon: PhoneFilled },
    { name: 'BellOutlined', icon: BellOutlined },
    { name: 'BellFilled', icon: BellFilled },
    { name: 'SendOutlined', icon: SendOutlined },
    { name: 'InboxOutlined', icon: InboxOutlined },
    { name: 'CustomerServiceOutlined', icon: CustomerServiceOutlined },
    { name: 'CustomerServiceFilled', icon: CustomerServiceFilled },
    { name: 'GlobalOutlined', icon: GlobalOutlined },
    { name: 'GlobalFilled', icon: GlobalFilled },
  ],

  // Mídia e Entretenimento
  media: [
    { name: 'CameraOutlined', icon: CameraOutlined },
    { name: 'CameraFilled', icon: CameraFilled },
    { name: 'PictureOutlined', icon: PictureOutlined },
    { name: 'PictureFilled', icon: PictureFilled },
    { name: 'VideoCameraOutlined', icon: VideoCameraOutlined },
    { name: 'VideoCameraFilled', icon: VideoCameraFilled },
    { name: 'PlayCircleOutlined', icon: PlayCircleOutlined },
    { name: 'PlayCircleFilled', icon: PlayCircleFilled },
    { name: 'PauseCircleOutlined', icon: PauseCircleOutlined },
    { name: 'PauseCircleFilled', icon: PauseCircleFilled },
    { name: 'StepBackwardOutlined', icon: StepBackwardOutlined },
    { name: 'StepForwardOutlined', icon: StepForwardOutlined },
    { name: 'SoundOutlined', icon: SoundOutlined },
    { name: 'SoundFilled', icon: SoundFilled },
    { name: 'MutedOutlined', icon: MutedOutlined },
    { name: 'MutedFilled', icon: MutedFilled },
  ],

  // Ações e Ferramentas
  actions: [
    { name: 'PlusOutlined', icon: PlusOutlined },
    { name: 'PlusFilled', icon: PlusFilled },
    { name: 'MinusOutlined', icon: MinusOutlined },
    { name: 'EditOutlined', icon: EditOutlined },
    { name: 'EditFilled', icon: EditFilled },
    { name: 'DeleteOutlined', icon: DeleteOutlined },
    { name: 'DeleteFilled', icon: DeleteFilled },
    { name: 'CopyOutlined', icon: CopyOutlined },
    { name: 'CopyFilled', icon: CopyFilled },
    { name: 'SaveOutlined', icon: SaveOutlined },
    { name: 'SaveFilled', icon: SaveFilled },
    { name: 'DownloadOutlined', icon: DownloadOutlined },
    { name: 'DownloadFilled', icon: DownloadFilled },
    { name: 'UploadOutlined', icon: UploadOutlined },
    { name: 'UploadFilled', icon: UploadFilled },
    { name: 'ReloadOutlined', icon: ReloadOutlined },
    { name: 'SyncOutlined', icon: SyncOutlined },
    { name: 'UndoOutlined', icon: UndoOutlined },
    { name: 'RedoOutlined', icon: RedoOutlined },
    { name: 'SwapOutlined', icon: SwapOutlined },
  ],

  // Sistema e Segurança
  system: [
    { name: 'SettingOutlined', icon: SettingOutlined },
    { name: 'SettingFilled', icon: SettingFilled },
    { name: 'ControlOutlined', icon: ControlOutlined },
    { name: 'ToolOutlined', icon: ToolOutlined },
    { name: 'SafetyOutlined', icon: SafetyOutlined },
    { name: 'SafetyFilled', icon: SafetyFilled },
    { name: 'LockOutlined', icon: LockOutlined },
    { name: 'LockFilled', icon: LockFilled },
    { name: 'UnlockOutlined', icon: UnlockOutlined },
    { name: 'UnlockFilled', icon: UnlockFilled },
    { name: 'KeyOutlined', icon: KeyOutlined },
    { name: 'EyeOutlined', icon: EyeOutlined },
    { name: 'EyeFilled', icon: EyeFilled },
    { name: 'EyeInvisibleOutlined', icon: EyeInvisibleOutlined },
    { name: 'EyeInvisibleFilled', icon: EyeInvisibleFilled },
    { name: 'PoweroffOutlined', icon: PoweroffOutlined },
    { name: 'PoweroffFilled', icon: PoweroffFilled },
    { name: 'WifiOutlined', icon: WifiOutlined },
    { name: 'WifiFilled', icon: WifiFilled },
    { name: 'BatteryTwoToneOutlined', icon: BatteryTwoToneOutlined },
  ],

  // Status e Feedback
  status: [
    { name: 'InfoCircleOutlined', icon: InfoCircleOutlined },
    { name: 'InfoCircleFilled', icon: InfoCircleFilled },
    { name: 'QuestionCircleOutlined', icon: QuestionCircleOutlined },
    { name: 'QuestionCircleFilled', icon: QuestionCircleFilled },
    { name: 'ExclamationCircleOutlined', icon: ExclamationCircleOutlined },
    { name: 'ExclamationCircleFilled', icon: ExclamationCircleFilled },
    { name: 'WarningOutlined', icon: WarningOutlined },
    { name: 'WarningFilled', icon: WarningFilled },
    { name: 'CheckCircleOutlined', icon: CheckCircleOutlined },
    { name: 'CheckCircleFilled', icon: CheckCircleFilled },
    { name: 'CloseCircleOutlined', icon: CloseCircleOutlined },
    { name: 'CloseCircleFilled', icon: CloseCircleFilled },
    { name: 'SmileOutlined', icon: SmileOutlined },
    { name: 'SmileFilled', icon: SmileFilled },
    { name: 'FrownOutlined', icon: FrownOutlined },
    { name: 'FrownFilled', icon: FrownFilled },
    { name: 'MehOutlined', icon: MehOutlined },
    { name: 'MehFilled', icon: MehFilled },
  ],

  // Negócios e Finanças
  business: [
    { name: 'ShoppingCartOutlined', icon: ShoppingCartOutlined },
    { name: 'ShoppingCartFilled', icon: ShoppingCartFilled },
    { name: 'CreditCardOutlined', icon: CreditCardOutlined },
    { name: 'CreditCardFilled', icon: CreditCardFilled },
    { name: 'DollarOutlined', icon: DollarOutlined },
    { name: 'DollarFilled', icon: DollarFilled },
    { name: 'BankOutlined', icon: BankOutlined },
    { name: 'ShopOutlined', icon: ShopOutlined },
    { name: 'TrophyOutlined', icon: TrophyOutlined },
    { name: 'TrophyFilled', icon: TrophyFilled },
    { name: 'GiftOutlined', icon: GiftOutlined },
    { name: 'GiftFilled', icon: GiftFilled },
    { name: 'RiseOutlined', icon: RiseOutlined },
    { name: 'RiseFilled', icon: RiseFilled },
    { name: 'FallOutlined', icon: FallOutlined },
    { name: 'FallFilled', icon: FallFilled },
  ],

  // Gráficos e Dados
  charts: [
    { name: 'BarChartOutlined', icon: BarChartOutlined },
    { name: 'BarChartFilled', icon: BarChartFilled },
    { name: 'PieChartOutlined', icon: PieChartOutlined },
    { name: 'PieChartFilled', icon: PieChartFilled },
    { name: 'LineChartOutlined', icon: LineChartOutlined },
    { name: 'LineChartFilled', icon: LineChartFilled },
    { name: 'DashboardOutlined', icon: DashboardOutlined },
    { name: 'DatabaseOutlined', icon: DatabaseOutlined },
    { name: 'DatabaseFilled', icon: DatabaseFilled },
  ],

  // Organização
  organization: [
    { name: 'CalendarOutlined', icon: CalendarOutlined },
    { name: 'CalendarFilled', icon: CalendarFilled },
    { name: 'ClockCircleOutlined', icon: ClockCircleOutlined },
    { name: 'ClockCircleFilled', icon: ClockCircleFilled },
    { name: 'BookOutlined', icon: BookOutlined },
    { name: 'BookFilled', icon: BookFilled },
    { name: 'FlagOutlined', icon: FlagOutlined },
    { name: 'FlagFilled', icon: FlagFilled },
    { name: 'TagOutlined', icon: TagOutlined },
    { name: 'TagFilled', icon: TagFilled },
    { name: 'PaperClipOutlined', icon: PaperClipOutlined },
    { name: 'PaperClipFilled', icon: PaperClipFilled },
    { name: 'FileOutlined', icon: FileOutlined },
    { name: 'FileFilled', icon: FileFilled },
    { name: 'FolderOutlined', icon: FolderOutlined },
    { name: 'FolderFilled', icon: FolderFilled },
  ],

  // Layout e Design
  layout: [
    { name: 'AppstoreOutlined', icon: AppstoreOutlined },
    { name: 'AppstoreFilled', icon: AppstoreFilled },
    { name: 'UnorderedListOutlined', icon: UnorderedListOutlined },
    { name: 'UnorderedListFilled', icon: UnorderedListFilled },
    { name: 'OrderedListOutlined', icon: OrderedListOutlined },
    { name: 'LayoutOutlined', icon: LayoutOutlined },
    { name: 'LayoutFilled', icon: LayoutFilled },
    { name: 'TableOutlined', icon: TableOutlined },
    { name: 'TableFilled', icon: TableFilled },
    { name: 'BorderOutlined', icon: BorderOutlined },
    { name: 'BorderFilled', icon: BorderFilled },
    { name: 'BorderlessTableOutlined', icon: BorderlessTableOutlined },
    { name: 'BorderlessTableFilled', icon: BorderlessTableFilled },
  ],

  // Tecnologia
  technology: [
    { name: 'CloudOutlined', icon: CloudOutlined },
    { name: 'CloudFilled', icon: CloudFilled },
    { name: 'CodeOutlined', icon: CodeOutlined },
    { name: 'ApiOutlined', icon: ApiOutlined },
    { name: 'ApiFilled', icon: ApiFilled },
    { name: 'BugOutlined', icon: BugOutlined },
    { name: 'BugFilled', icon: BugFilled },
    { name: 'ThunderboltOutlined', icon: ThunderboltOutlined },
    { name: 'ThunderboltFilled', icon: ThunderboltFilled },
    { name: 'RocketOutlined', icon: RocketOutlined },
    { name: 'RocketFilled', icon: RocketFilled },
    { name: 'BulbOutlined', icon: BulbOutlined },
    { name: 'BulbFilled', icon: BulbFilled },
    { name: 'FireOutlined', icon: FireOutlined },
    { name: 'FireFilled', icon: FireFilled },
    { name: 'DesktopOutlined', icon: DesktopOutlined },
    { name: 'MobileOutlined', icon: MobileOutlined },
    { name: 'TabletOutlined', icon: TabletOutlined },
    { name: 'LaptopOutlined', icon: LaptopOutlined },
  ],

  // Edição e Formatação
  editing: [
    { name: 'FormOutlined', icon: FormOutlined },
    { name: 'FontSizeOutlined', icon: FontSizeOutlined },
    { name: 'BoldOutlined', icon: BoldOutlined },
    { name: 'ItalicOutlined', icon: ItalicOutlined },
    { name: 'UnderlineOutlined', icon: UnderlineOutlined },
    { name: 'StrikethroughOutlined', icon: StrikethroughOutlined },
    { name: 'AlignLeftOutlined', icon: AlignLeftOutlined },
    { name: 'AlignCenterOutlined', icon: AlignCenterOutlined },
    { name: 'AlignRightOutlined', icon: AlignRightOutlined },
    { name: 'FontColorsOutlined', icon: FontColorsOutlined },
    { name: 'HighlightOutlined', icon: HighlightOutlined },
  ],

  // Visualização
  view: [
    { name: 'ZoomInOutlined', icon: ZoomInOutlined },
    { name: 'ZoomOutOutlined', icon: ZoomOutOutlined },
    { name: 'FullscreenOutlined', icon: FullscreenOutlined },
    { name: 'CompressOutlined', icon: CompressOutlined },
    { name: 'ExpandOutlined', icon: ExpandOutlined },
    { name: 'SelectOutlined', icon: SelectOutlined },
    { name: 'ClearOutlined', icon: ClearOutlined },
  ],

  // Localização e Transporte
  location: [
    { name: 'EnvironmentOutlined', icon: EnvironmentOutlined },
    { name: 'EnvironmentFilled', icon: EnvironmentFilled },
    { name: 'CarOutlined', icon: CarOutlined },
  ],

  // Medicina e Saúde
  medical: [
    { name: 'MedicineBoxOutlined', icon: MedicineBoxOutlined },
  ],

  // Impressão e Digitalização
  printing: [
    { name: 'PrinterOutlined', icon: PrinterOutlined },
    { name: 'ScannerOutlined', icon: ScannerOutlined },
    { name: 'QrcodeOutlined', icon: QrcodeOutlined },
    { name: 'BarcodeOutlined', icon: BarcodeOutlined },
  ],
};

interface AntIconLibraryProps {
  onSelectIcon: (iconName: string, IconComponent: React.ComponentType<any>) => void;
  onDragStart?: (iconName: string, IconComponent: React.ComponentType<any>) => void;
}

export function AntIconLibrary({ onSelectIcon, onDragStart }: AntIconLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Memoizar os ícones filtrados para performance
  const filteredIcons = useMemo(() => {
    let allIcons: Array<{ name: string; icon: React.ComponentType<any>; category: string }> = [];
    
    // Combinar todos os ícones com suas categorias
    Object.entries(antIconLibrary).forEach(([category, icons]) => {
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

  const handleSelectIcon = (iconName: string, IconComponent: React.ComponentType<any>) => {
    onSelectIcon(iconName, IconComponent);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const handleDragStart = (e: React.DragEvent, iconName: string, IconComponent: React.ComponentType<any>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'icon',
      iconName,
      iconComponent: iconName // Armazenar o nome para reconstruir o componente
    }));
    
    if (onDragStart) {
      onDragStart(iconName, IconComponent);
    }
  };

  const categories = [
    { id: 'all', name: 'Todos', count: Object.values(antIconLibrary).flat().length },
    { id: 'navigation', name: 'Navegação', count: antIconLibrary.navigation.length },
    { id: 'social', name: 'Social', count: antIconLibrary.social.length },
    { id: 'communication', name: 'Comunicação', count: antIconLibrary.communication.length },
    { id: 'media', name: 'Mídia', count: antIconLibrary.media.length },
    { id: 'actions', name: 'Ações', count: antIconLibrary.actions.length },
    { id: 'system', name: 'Sistema', count: antIconLibrary.system.length },
    { id: 'status', name: 'Status', count: antIconLibrary.status.length },
    { id: 'business', name: 'Negócios', count: antIconLibrary.business.length },
    { id: 'charts', name: 'Gráficos', count: antIconLibrary.charts.length },
    { id: 'organization', name: 'Organização', count: antIconLibrary.organization.length },
    { id: 'layout', name: 'Layout', count: antIconLibrary.layout.length },
    { id: 'technology', name: 'Tecnologia', count: antIconLibrary.technology.length },
    { id: 'editing', name: 'Edição', count: antIconLibrary.editing.length },
    { id: 'view', name: 'Visualização', count: antIconLibrary.view.length },
    { id: 'location', name: 'Localização', count: antIconLibrary.location.length },
    { id: 'medical', name: 'Medicina', count: antIconLibrary.medical.length },
    { id: 'printing', name: 'Impressão', count: antIconLibrary.printing.length },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          📦 Biblioteca de Ícones Ant Design
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Biblioteca de Ícones Ant Design</DialogTitle>
          <p className="text-muted-foreground">
            Clique para selecionar ou arraste diretamente para o wireframe
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Busca */}
          <div>
            <Label htmlFor="ant-icon-search">Buscar ícone</Label>
            <Input
              id="ant-icon-search"
              placeholder="Digite para buscar... (ex: home, user, mail)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          
          {/* Categorias */}
          <div>
            <Label>Categorias</Label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-1"
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Contador de resultados */}
          <div className="text-sm text-muted-foreground">
            {filteredIcons.length} ícones encontrados
          </div>
          
          {/* Grid de Ícones */}
          <ScrollArea className="h-96">
            <div className="grid grid-cols-10 gap-2 p-2">
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
                      className="h-14 w-14 p-0 flex flex-col gap-1 cursor-move group-hover:border-primary transition-colors"
                      onClick={() => handleSelectIcon(iconData.name, IconComponent)}
                      onDragStart={(e) => handleDragStart(e, iconData.name, IconComponent)}
                      draggable
                      title={`${iconData.name} (${iconData.category})`}
                    >
                      <IconComponent className="w-6 h-6 text-current" />
                      <span className="text-xs truncate w-full px-1">
                        {iconData.name.replace('Outlined', '').replace('Filled', '')}
                      </span>
                    </Button>
                  </div>
                );
              })}
            </div>
            
            {filteredIcons.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <SearchOutlined className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum ícone encontrado</p>
                <p className="text-sm">Tente buscar com outros termos</p>
              </div>
            )}
          </ScrollArea>
          
          {/* Instruções */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <div className="font-medium mb-1">💡 Dicas de uso:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>Clique</strong> no ícone para adicionar ao wireframe</li>
              <li>• <strong>Arraste</strong> o ícone diretamente para posicioná-lo</li>
              <li>• Use a busca para encontrar ícones específicos</li>
              <li>• Ícones "Outlined" são vazados, "Filled" são preenchidos</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}