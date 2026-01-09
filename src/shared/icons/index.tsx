/**
 * 중앙 집중식 아이콘 관리
 *
 * Lucide 아이콘의 stroke 버전과 solid(fill) 버전을 관리합니다.
 * - stroke: 기본 선 스타일 아이콘
 * - solid: fill='currentColor'를 적용한 채워진 스타일 아이콘
 *
 * 사용 예시:
 * import { Icons } from '@/shared/icons';
 * <Icons.Home size={24} />
 * <Icons.HomeSolid size={24} />
 */

import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Copy,
  Edit3,
  FileSearch,
  FileText,
  Filter,
  HelpCircle,
  Home,
  Layers,
  ListChecks,
  LogIn,
  Mail,
  MapPin,
  Minus,
  MoreVertical,
  Plus,
  Search,
  Settings,
  SortDesc,
  Star,
  TextAlignJustify,
  Trash2,
  Upload,
  User,
  UserCircle2,
  UserPlus,
  Users,
  X,
  type LucideProps,
} from 'lucide-react';

// 아이콘 타입 정의
type IconComponent = React.FC<LucideProps>;

// Stroke 버전 (기본)
export const ArrowRightIcon: IconComponent = (props) => (
  <ArrowRight {...props} />
);
export const CheckIcon: IconComponent = (props) => <Check {...props} />;
export const ChevronDownIcon: IconComponent = (props) => (
  <ChevronDown {...props} />
);
export const ChevronLeftIcon: IconComponent = (props) => (
  <ChevronLeft {...props} />
);
export const ChevronRightIcon: IconComponent = (props) => (
  <ChevronRight {...props} />
);
export const CloudUploadIcon: IconComponent = (props) => (
  <CloudUpload {...props} />
);
export const CopyIcon: IconComponent = (props) => <Copy {...props} />;
export const Edit3Icon: IconComponent = (props) => <Edit3 {...props} />;
export const FileSearchIcon: IconComponent = (props) => (
  <FileSearch {...props} />
);
export const FileTextIcon: IconComponent = (props) => <FileText {...props} />;
export const FilterIcon: IconComponent = (props) => <Filter {...props} />;
export const HelpCircleIcon: IconComponent = (props) => (
  <HelpCircle {...props} />
);
export const HomeIcon: IconComponent = (props) => <Home {...props} />;
export const LayersIcon: IconComponent = (props) => <Layers {...props} />;
export const ListChecksIcon: IconComponent = (props) => (
  <ListChecks {...props} />
);
export const LogInIcon: IconComponent = (props) => <LogIn {...props} />;
export const MailIcon: IconComponent = (props) => <Mail {...props} />;
export const MapPinIcon: IconComponent = (props) => <MapPin {...props} />;
export const MinusIcon: IconComponent = (props) => <Minus {...props} />;
export const MoreVerticalIcon: IconComponent = (props) => (
  <MoreVertical {...props} />
);
export const PlusIcon: IconComponent = (props) => <Plus {...props} />;
export const SearchIcon: IconComponent = (props) => <Search {...props} />;
export const SettingsIcon: IconComponent = (props) => <Settings {...props} />;
export const SortDescIcon: IconComponent = (props) => <SortDesc {...props} />;
export const StarIcon: IconComponent = (props) => <Star {...props} />;
export const Trash2Icon: IconComponent = (props) => <Trash2 {...props} />;
export const UploadIcon: IconComponent = (props) => <Upload {...props} />;
export const UserIcon: IconComponent = (props) => <User {...props} />;
export const UserCircle2Icon: IconComponent = (props) => (
  <UserCircle2 {...props} />
);
export const UserPlusIcon: IconComponent = (props) => <UserPlus {...props} />;
export const UsersIcon: IconComponent = (props) => <Users {...props} />;
export const XIcon: IconComponent = (props) => <X {...props} />;
export const TextAlignJustifyIcon: IconComponent = (props) => (
  <TextAlignJustify {...props} />
);

// Solid 버전 (fill='currentColor' 적용)
export const ArrowRightIconSolid: IconComponent = (props) => (
  <ArrowRight {...props} fill="currentColor" />
);
export const CheckIconSolid: IconComponent = (props) => (
  <Check {...props} fill="currentColor" />
);
export const ChevronDownIconSolid: IconComponent = (props) => (
  <ChevronDown {...props} fill="currentColor" />
);
export const ChevronLeftIconSolid: IconComponent = (props) => (
  <ChevronLeft {...props} fill="currentColor" />
);
export const ChevronRightIconSolid: IconComponent = (props) => (
  <ChevronRight {...props} fill="currentColor" />
);
export const CloudUploadIconSolid: IconComponent = (props) => (
  <CloudUpload {...props} fill="currentColor" />
);
export const CopyIconSolid: IconComponent = (props) => (
  <Copy {...props} fill="currentColor" />
);
export const Edit3IconSolid: IconComponent = (props) => (
  <Edit3 {...props} fill="currentColor" />
);
export const FileSearchIconSolid: IconComponent = (props) => (
  <FileSearch {...props} fill="currentColor" />
);
export const FileTextIconSolid: IconComponent = (props) => (
  <FileText {...props} fill="currentColor" />
);
export const FilterIconSolid: IconComponent = (props) => (
  <Filter {...props} fill="currentColor" />
);
export const HelpCircleIconSolid: IconComponent = (props) => (
  <HelpCircle {...props} fill="currentColor" />
);
export const HomeIconSolid: IconComponent = (props) => (
  <Home {...props} fill="currentColor" />
);
export const LayersIconSolid: IconComponent = (props) => (
  <Layers {...props} fill="currentColor" />
);
export const ListChecksIconSolid: IconComponent = (props) => (
  <ListChecks {...props} fill="currentColor" />
);
export const LogInIconSolid: IconComponent = (props) => (
  <LogIn {...props} fill="currentColor" />
);
export const MailIconSolid: IconComponent = (props) => (
  <Mail {...props} fill="currentColor" />
);
export const MapPinIconSolid: IconComponent = (props) => (
  <MapPin {...props} fill="currentColor" />
);
export const MinusIconSolid: IconComponent = (props) => (
  <Minus {...props} fill="currentColor" />
);
export const MoreVerticalIconSolid: IconComponent = (props) => (
  <MoreVertical {...props} fill="currentColor" />
);
export const PlusIconSolid: IconComponent = (props) => (
  <Plus {...props} fill="currentColor" />
);
export const SearchIconSolid: IconComponent = (props) => (
  <Search {...props} fill="currentColor" />
);
export const SettingsIconSolid: IconComponent = (props) => (
  <Settings {...props} fill="currentColor" />
);
export const SortDescIconSolid: IconComponent = (props) => (
  <SortDesc {...props} fill="currentColor" />
);
export const StarIconSolid: IconComponent = (props) => (
  <Star {...props} fill="currentColor" />
);
export const Trash2IconSolid: IconComponent = (props) => (
  <Trash2 {...props} fill="currentColor" />
);
export const UploadIconSolid: IconComponent = (props) => (
  <Upload {...props} fill="currentColor" />
);
export const UserIconSolid: IconComponent = (props) => (
  <User {...props} fill="currentColor" />
);
export const UserCircle2IconSolid: IconComponent = (props) => (
  <UserCircle2 {...props} fill="currentColor" />
);
export const UserPlusIconSolid: IconComponent = (props) => (
  <UserPlus {...props} fill="currentColor" />
);
export const UsersIconSolid: IconComponent = (props) => (
  <Users {...props} fill="currentColor" />
);
export const XIconSolid: IconComponent = (props) => (
  <X {...props} fill="currentColor" />
);

export const TextAlignJustifySolid: IconComponent = (props) => (
  <TextAlignJustify {...props} fill="currentColor" />
);

// 편의를 위한 네임스페이스 export
export const Icons = {
  // Stroke 버전
  ArrowRight: ArrowRightIcon,
  Check: CheckIcon,
  ChevronDown: ChevronDownIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  CloudUpload: CloudUploadIcon,
  Copy: CopyIcon,
  Edit3: Edit3Icon,
  FileSearch: FileSearchIcon,
  FileText: FileTextIcon,
  Filter: FilterIcon,
  HelpCircle: HelpCircleIcon,
  Home: HomeIcon,
  Layers: LayersIcon,
  ListChecks: ListChecksIcon,
  LogIn: LogInIcon,
  Mail: MailIcon,
  MapPin: MapPinIcon,
  Minus: MinusIcon,
  MoreVertical: MoreVerticalIcon,
  Plus: PlusIcon,
  Search: SearchIcon,
  Settings: SettingsIcon,
  SortDesc: SortDescIcon,
  Star: StarIcon,
  Trash2: Trash2Icon,
  Upload: UploadIcon,
  User: UserIcon,
  UserCircle2: UserCircle2Icon,
  UserPlus: UserPlusIcon,
  Users: UsersIcon,
  X: XIcon,
  TextAlignJustify: TextAlignJustifyIcon,

  // Solid 버전
  ArrowRightSolid: ArrowRightIconSolid,
  CheckSolid: CheckIconSolid,
  ChevronDownSolid: ChevronDownIconSolid,
  ChevronLeftSolid: ChevronLeftIconSolid,
  ChevronRightSolid: ChevronRightIconSolid,
  CloudUploadSolid: CloudUploadIconSolid,
  CopySolid: CopyIconSolid,
  Edit3Solid: Edit3IconSolid,
  FileSearchSolid: FileSearchIconSolid,
  FileTextSolid: FileTextIconSolid,
  FilterSolid: FilterIconSolid,
  HelpCircleSolid: HelpCircleIconSolid,
  HomeSolid: HomeIconSolid,
  LayersSolid: LayersIconSolid,
  ListChecksSolid: ListChecksIconSolid,
  LogInSolid: LogInIconSolid,
  MailSolid: MailIconSolid,
  MapPinSolid: MapPinIconSolid,
  MinusSolid: MinusIconSolid,
  MoreVerticalSolid: MoreVerticalIconSolid,
  PlusSolid: PlusIconSolid,
  SearchSolid: SearchIconSolid,
  SettingsSolid: SettingsIconSolid,
  SortDescSolid: SortDescIconSolid,
  StarSolid: StarIconSolid,
  Trash2Solid: Trash2IconSolid,
  UploadSolid: UploadIconSolid,
  UserSolid: UserIconSolid,
  UserCircle2Solid: UserCircle2IconSolid,
  UserPlusSolid: UserPlusIconSolid,
  UsersSolid: UsersIconSolid,
  XSolid: XIconSolid,
  TextAlignJustifySolid: TextAlignJustifySolid,
} as const;
