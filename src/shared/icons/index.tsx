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

// ─────────────────────────────────────────────────────────────────────────────
// Custom Icons (Lucide에 없는 커스텀 아이콘)
// ─────────────────────────────────────────────────────────────────────────────

interface CustomIconProps {
  size?: number;
  className?: string;
}

/** Undo 아이콘 - 왼쪽 화살표 + 곡선 */
export const UndoIcon: React.FC<CustomIconProps> = ({
  size = 18,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M9.33333 17.3307L4 11.9974M4 11.9974L9.33333 6.66406M4 11.9974H21.3333C25.0152 11.9974 28 14.9822 28 18.6641C28 22.346 25.0152 25.3307 21.3333 25.3307H14.6667"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Redo 아이콘 - 오른쪽 화살표 + 곡선 (Undo 좌우대칭) */
export const RedoIcon: React.FC<CustomIconProps> = ({
  size = 18,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M22.6667 17.3307L28 11.9974M28 11.9974L22.6667 6.66406M28 11.9974H10.6667C6.98477 11.9974 4 14.9822 4 18.6641C4 22.346 6.98477 25.3307 10.6667 25.3307H17.3333"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// SideTab Custom Icons (사이드탭 전용 커스텀 아이콘)
// ─────────────────────────────────────────────────────────────────────────────

/** 홈 아이콘 */
export const SideHomeIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 17.0007V11.4527C20 10.9184 19.9995 10.6511 19.9346 10.4024C19.877 10.1821 19.7825 9.97356 19.6546 9.78513C19.5102 9.5725 19.3096 9.39618 18.9074 9.04431L14.1074 4.84431C13.3608 4.19103 12.9875 3.86455 12.5674 3.74031C12.1972 3.63083 11.8026 3.63083 11.4324 3.74031C11.0126 3.86446 10.6398 4.19063 9.89436 4.84292L5.09277 9.04432C4.69064 9.39618 4.49004 9.5725 4.3457 9.78513C4.21779 9.97356 4.12255 10.1821 4.06497 10.4024C4 10.6511 4 10.9184 4 11.4527V17.0007C4 17.9325 4 18.3983 4.15224 18.7658C4.35523 19.2559 4.74432 19.6457 5.23438 19.8487C5.60192 20.0009 6.06786 20.001 6.99974 20.001C7.93163 20.001 8.39808 20.0009 8.76562 19.8487C9.25568 19.6457 9.64467 19.256 9.84766 18.7659C9.9999 18.3984 10 17.9324 10 17.0006V16.0006C10 14.896 10.8954 14.0006 12 14.0006C13.1046 14.0006 14 14.896 14 16.0006V17.0006C14 17.9324 14 18.3984 14.1522 18.7659C14.3552 19.256 14.7443 19.6457 15.2344 19.8487C15.6019 20.0009 16.0679 20.001 16.9997 20.001C17.9316 20.001 18.3981 20.0009 18.7656 19.8487C19.2557 19.6457 19.6447 19.2559 19.8477 18.7658C19.9999 18.3983 20 17.9325 20 17.0007Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 일정 아이콘 */
export const SideCalendarIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 8H20M4 8V16.8002C4 17.9203 4 18.4801 4.21799 18.9079C4.40973 19.2842 4.71547 19.5905 5.0918 19.7822C5.5192 20 6.07899 20 7.19691 20H16.8031C17.921 20 18.48 20 18.9074 19.7822C19.2837 19.5905 19.5905 19.2842 19.7822 18.9079C20 18.4805 20 17.9215 20 16.8036V8M4 8V7.2002C4 6.08009 4 5.51962 4.21799 5.0918C4.40973 4.71547 4.71547 4.40973 5.0918 4.21799C5.51962 4 6.08009 4 7.2002 4H8M20 8V7.19691C20 6.07899 20 5.5192 19.7822 5.0918C19.5905 4.71547 19.2837 4.40973 18.9074 4.21799C18.4796 4 17.9203 4 16.8002 4H16M8 4H16M8 4V2M16 4V2M16 12H8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 클라이언트 아이콘 */
export const SideClientIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M21 19.9999C21 18.2583 19.3304 16.7767 17 16.2275M15 20C15 17.7909 12.3137 16 9 16C5.68629 16 3 17.7909 3 20M15 13C17.2091 13 19 11.2091 19 9C19 6.79086 17.2091 5 15 5M9 13C6.79086 13 5 11.2091 5 9C5 6.79086 6.79086 5 9 5C11.2091 5 13 6.79086 13 9C13 11.2091 11.2091 13 9 13Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 상담 기록 아이콘 */
export const SideSessionIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M9 17H15M9 14H15M13.0004 3.00087C12.9048 3 12.7974 3 12.6747 3H8.2002C7.08009 3 6.51962 3 6.0918 3.21799C5.71547 3.40973 5.40973 3.71547 5.21799 4.0918C5 4.51962 5 5.08009 5 6.2002V17.8002C5 18.9203 5 19.4801 5.21799 19.9079C5.40973 20.2842 5.71547 20.5905 6.0918 20.7822C6.51921 21 7.079 21 8.19694 21L15.8031 21C16.921 21 17.48 21 17.9074 20.7822C18.2837 20.5905 18.5905 20.2842 18.7822 19.9079C19 19.4805 19 18.9215 19 17.8036V9.32568C19 9.20302 18.9999 9.09553 18.999 9M13.0004 3.00087C13.2858 3.00348 13.4657 3.01407 13.6382 3.05547C13.8423 3.10446 14.0379 3.18526 14.2168 3.29492C14.4186 3.41857 14.5918 3.59181 14.9375 3.9375L18.063 7.06298C18.4089 7.40889 18.5809 7.58136 18.7046 7.78319C18.8142 7.96214 18.8953 8.15726 18.9443 8.36133C18.9857 8.53379 18.9964 8.71454 18.999 9M13.0004 3.00087L13 5.80021C13 6.92031 13 7.48015 13.218 7.90797C13.4097 8.2843 13.7155 8.59048 14.0918 8.78223C14.5192 9 15.079 9 16.1969 9H18.999"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 템플릿 아이콘 */
export const SideTemplateIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M21 12L12 18L3 12M21 16L12 22L3 16M21 8L12 14L3 8L12 2L21 8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 가계도 아이콘 */
export const SideGenogramIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <mask id="side-genogram-mask" fill="white">
      <rect x="1" y="1" width="8.88889" height="8.88889" rx="1.11111" />
    </mask>
    <rect
      x="1"
      y="1"
      width="8.88889"
      height="8.88889"
      rx="1.11111"
      stroke="currentColor"
      strokeWidth="3"
      mask="url(#side-genogram-mask)"
    />
    <circle
      cx="18.9444"
      cy="5.44444"
      r="3.69444"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="11.9444"
      cy="18.4444"
      r="3.69444"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M5.5 9C5.5 10 5.5 12 5.5 12H19V9"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M12 12.1094V14.3316" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** 심리검사 분석 아이콘 */
export const SideAnalysisIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3 15.0002V16.8C3 17.9201 3 18.4798 3.21799 18.9076C3.40973 19.2839 3.71547 19.5905 4.0918 19.7822C4.5192 20 5.07899 20 6.19691 20H21.0002M3 15.0002V5M3 15.0002L6.8534 11.7891L6.85658 11.7865C7.55366 11.2056 7.90288 10.9146 8.28154 10.7964C8.72887 10.6567 9.21071 10.6788 9.64355 10.8584C10.0105 11.0106 10.3323 11.3324 10.9758 11.9759L10.9822 11.9823C11.6357 12.6358 11.9633 12.9635 12.3362 13.1153C12.7774 13.2951 13.2685 13.3106 13.7207 13.1606C14.1041 13.0334 14.4542 12.7275 15.1543 12.115L21 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 설정 아이콘 */
export const SideSettingsIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20.3499 8.92293L19.9837 8.7192C19.9269 8.68757 19.8989 8.67169 19.8714 8.65524C19.5983 8.49165 19.3682 8.26564 19.2002 7.99523C19.1833 7.96802 19.1674 7.93949 19.1348 7.8831C19.1023 7.82678 19.0858 7.79824 19.0706 7.76998C18.92 7.48866 18.8385 7.17515 18.8336 6.85606C18.8331 6.82398 18.8332 6.79121 18.8343 6.72604L18.8415 6.30078C18.8529 5.62025 18.8587 5.27894 18.763 4.97262C18.6781 4.70053 18.536 4.44993 18.3462 4.23725C18.1317 3.99685 17.8347 3.82534 17.2402 3.48276L16.7464 3.1982C16.1536 2.85658 15.8571 2.68571 15.5423 2.62057C15.2639 2.56294 14.9765 2.56561 14.6991 2.62789C14.3859 2.69819 14.0931 2.87351 13.5079 3.22396L13.5045 3.22555L13.1507 3.43741C13.0948 3.47091 13.0665 3.48779 13.0384 3.50338C12.7601 3.6581 12.4495 3.74365 12.1312 3.75387C12.0992 3.7549 12.0665 3.7549 12.0013 3.7549C11.9365 3.7549 11.9024 3.7549 11.8704 3.75387C11.5515 3.74361 11.2402 3.65759 10.9615 3.50224C10.9334 3.48658 10.9056 3.46956 10.8496 3.4359L10.4935 3.22213C9.90422 2.86836 9.60915 2.69121 9.29427 2.62057C9.0157 2.55807 8.72737 2.55634 8.44791 2.61471C8.13236 2.68062 7.83577 2.85276 7.24258 3.19703L7.23994 3.1982L6.75228 3.48124L6.74688 3.48454C6.15904 3.82572 5.86441 3.99672 5.6517 4.23614C5.46294 4.4486 5.32185 4.69881 5.2374 4.97018C5.14194 5.27691 5.14703 5.61896 5.15853 6.3027L5.16568 6.72736C5.16676 6.79166 5.16864 6.82362 5.16817 6.85525C5.16343 7.17499 5.08086 7.48914 4.92974 7.77096C4.9148 7.79883 4.8987 7.8267 4.86654 7.88237C4.83436 7.93809 4.81877 7.96579 4.80209 7.99268C4.63336 8.26453 4.40214 8.49186 4.12733 8.65572C4.10015 8.67193 4.0715 8.68752 4.01521 8.71871L3.65365 8.91908C3.05208 9.25245 2.75137 9.41928 2.53256 9.6567C2.33898 9.86672 2.19275 10.1158 2.10349 10.3872C2.00259 10.6939 2.00267 11.0378 2.00424 11.7255L2.00551 12.2877C2.00706 12.9708 2.00919 13.3122 2.11032 13.6168C2.19979 13.8863 2.34495 14.134 2.53744 14.3427C2.75502 14.5787 3.05274 14.7445 3.64974 15.0766L4.00808 15.276C4.06907 15.3099 4.09976 15.3266 4.12917 15.3444C4.40148 15.5083 4.63089 15.735 4.79818 16.0053C4.81625 16.0345 4.8336 16.0648 4.8683 16.1255C4.90256 16.1853 4.92009 16.2152 4.93594 16.2452C5.08261 16.5229 5.16114 16.8315 5.16649 17.1455C5.16707 17.1794 5.16658 17.2137 5.16541 17.2827L5.15853 17.6902C5.14695 18.3763 5.1419 18.7197 5.23792 19.0273C5.32287 19.2994 5.46484 19.55 5.65463 19.7627C5.86915 20.0031 6.16655 20.1745 6.76107 20.5171L7.25478 20.8016C7.84763 21.1432 8.14395 21.3138 8.45869 21.379C8.73714 21.4366 9.02464 21.4344 9.30209 21.3721C9.61567 21.3017 9.90948 21.1258 10.4964 20.7743L10.8502 20.5625C10.9062 20.5289 10.9346 20.5121 10.9626 20.4965C11.2409 20.3418 11.5512 20.2558 11.8695 20.2456C11.9015 20.2446 11.9342 20.2446 11.9994 20.2446C12.0648 20.2446 12.0974 20.2446 12.1295 20.2456C12.4484 20.2559 12.7607 20.3422 13.0394 20.4975C13.0639 20.5112 13.0885 20.526 13.1316 20.5519L13.5078 20.7777C14.0971 21.1315 14.3916 21.3081 14.7065 21.3788C14.985 21.4413 15.2736 21.4438 15.5531 21.3855C15.8685 21.3196 16.1657 21.1471 16.7586 20.803L17.2536 20.5157C17.8418 20.1743 18.1367 20.0031 18.3495 19.7636C18.5383 19.5512 18.6796 19.3011 18.764 19.0297C18.8588 18.7252 18.8531 18.3858 18.8417 17.7119L18.8343 17.2724C18.8332 17.2081 18.8331 17.1761 18.8336 17.1445C18.8383 16.8248 18.9195 16.5104 19.0706 16.2286C19.0856 16.2007 19.1018 16.1727 19.1338 16.1172C19.166 16.0615 19.1827 16.0337 19.1994 16.0068C19.3681 15.7349 19.5995 15.5074 19.8744 15.3436C19.9012 15.3275 19.9289 15.3122 19.9838 15.2818L19.9857 15.2809L20.3472 15.0805C20.9488 14.7472 21.2501 14.5802 21.4689 14.3427C21.6625 14.1327 21.8085 13.8839 21.8978 13.6126C21.9981 13.3077 21.9973 12.9658 21.9958 12.2861L21.9945 11.7119C21.9929 11.0287 21.9921 10.6874 21.891 10.3828C21.8015 10.1133 21.6555 9.86561 21.463 9.65685C21.2457 9.42111 20.9475 9.25526 20.3517 8.92378L20.3499 8.92293Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.00033 12C8.00033 14.2091 9.79119 16 12.0003 16C14.2095 16 16.0003 14.2091 16.0003 12C16.0003 9.79082 14.2095 7.99996 12.0003 7.99996C9.79119 7.99996 8.00033 9.79082 8.00033 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 도움말 및 지원 아이콘 */
export const SideHelpIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M9.14648 9.07361C9.31728 8.54732 9.63015 8.07896 10.0508 7.71948C10.4714 7.36001 10.9838 7.12378 11.5303 7.03708C12.0768 6.95038 12.6362 7.0164 13.1475 7.22803C13.6587 7.43966 14.1014 7.78875 14.4268 8.23633C14.7521 8.68391 14.9469 9.21256 14.9904 9.76416C15.0339 10.3158 14.9238 10.8688 14.6727 11.3618C14.4215 11.8548 14.0394 12.2685 13.5676 12.5576C13.0958 12.8467 12.5533 12.9998 12 12.9998V14.0002M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21ZM12.0498 17V17.1L11.9502 17.1002V17H12.0498Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 잠금 아이콘 */
export const SideLockIcon: React.FC<CustomIconProps> = ({
  size = 14,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.0846 4.914V4.08332C11.0846 1.82818 9.25647 0 7.00129 0C4.74612 0 2.91797 1.82818 2.91797 4.08332V4.914C1.85632 5.37734 1.1695 6.42499 1.16797 7.58332V11.0833C1.16988 12.6934 2.47459 13.9981 4.08462 14H9.91794C11.528 13.9981 12.8327 12.6934 12.8346 11.0833V7.58332C12.8331 6.42499 12.1463 5.37734 11.0846 4.914ZM7.58462 9.91668C7.58462 10.2388 7.32346 10.5 7.00129 10.5C6.67913 10.5 6.41797 10.2388 6.41797 9.91668V8.75C6.41797 8.42784 6.67913 8.16668 7.00129 8.16668C7.32346 8.16668 7.58462 8.42784 7.58462 8.75V9.91668ZM9.91797 4.66668H4.08462V4.08335C4.08462 2.47253 5.39045 1.16668 7.00129 1.16668C8.61214 1.16668 9.91797 2.4725 9.91797 4.08335V4.66668Z"
      fill="currentColor"
    />
  </svg>
);

/** 가계도 아이콘 (기존 호환) - 사각형 + 원 2개 + 연결선 */
export const GenogramIcon: React.FC<CustomIconProps> = ({
  size = 18,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <mask id="path-1-inside-1_5497_51436" fill="white">
      <rect x="1" y="1" width="8.88889" height="8.88889" rx="1.11111" />
    </mask>
    <rect
      x="1"
      y="1"
      width="8.88889"
      height="8.88889"
      rx="1.11111"
      stroke="currentColor"
      strokeWidth="3"
      mask="url(#path-1-inside-1_5497_51436)"
    />
    <circle
      cx="18.9444"
      cy="5.44444"
      r="3.69444"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="11.9444"
      cy="18.4444"
      r="3.69444"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M5.5 9C5.5 10 5.5 12 5.5 12H19V9"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M12 12.1094V14.3316" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** 쿠폰 아이콘 */
export const CouponIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14 6H6C5.06812 6 4.60192 6 4.23438 6.15224C3.74432 6.35523 3.35523 6.74481 3.15224 7.23486C3 7.60241 3 8.06835 3 9.00023C4.65685 9.00023 6 10.3429 6 11.9998C6 13.6566 4.65685 15 3 15C3 15.9319 3 16.3978 3.15224 16.7654C3.35523 17.2554 3.74432 17.6447 4.23438 17.8477C4.60192 17.9999 5.06812 18 6 18H14M14 6H18C18.9319 6 19.3978 6 19.7654 6.15224C20.2554 6.35523 20.6447 6.74481 20.8477 7.23486C20.9999 7.6024 20.9999 8.06835 20.9999 9.00023C19.343 9.00023 18 10.3431 18 12C18 13.6569 19.343 15 20.9999 15C20.9999 15.9319 20.9999 16.3978 20.8477 16.7654C20.6447 17.2554 20.2554 17.6447 19.7654 17.8477C19.3978 17.9999 18.9319 18 18 18H14M14 6V18"
      stroke="#A2A2A2"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
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

  // Custom Icons
  Undo: UndoIcon,
  Redo: RedoIcon,
  Genogram: GenogramIcon,

  // SideTab Custom Icons
  SideHome: SideHomeIcon,
  SideCalendar: SideCalendarIcon,
  SideClient: SideClientIcon,
  SideSession: SideSessionIcon,
  SideTemplate: SideTemplateIcon,
  SideGenogram: SideGenogramIcon,
  SideAnalysis: SideAnalysisIcon,
  SideSettings: SideSettingsIcon,
  SideHelp: SideHelpIcon,
  SideLock: SideLockIcon,
} as const;
