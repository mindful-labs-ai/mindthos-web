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
  Menu,
  Minus,
  MoreVertical,
  Plus,
  RotateCw,
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
export const MenuIcon: IconComponent = (props) => <Menu {...props} />;
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

/** Copy 아이콘 - 겹쳐있는 두 사각형 */
export const CopyIcon: React.FC<CustomIconProps> = ({
  size = 18,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7.5 7.5V5.16683C7.5 4.23341 7.5 3.76635 7.68166 3.40983C7.84145 3.09623 8.09623 2.84144 8.40983 2.68166C8.76635 2.5 9.23341 2.5 10.1668 2.5H14.8335C15.7669 2.5 16.2334 2.5 16.5899 2.68166C16.9035 2.84144 17.1587 3.09623 17.3185 3.40983C17.5002 3.76635 17.5002 4.23306 17.5002 5.16648V9.83317C17.5002 10.7666 17.5002 11.2333 17.3185 11.5898C17.1587 11.9034 16.9033 12.1587 16.5897 12.3185C16.2335 12.5 15.7675 12.5 14.8359 12.5H12.5M7.5 7.5H5.16683C4.23341 7.5 3.76635 7.5 3.40983 7.68166C3.09623 7.84144 2.84144 8.09623 2.68166 8.40983C2.5 8.76635 2.5 9.23341 2.5 10.1668V14.8335C2.5 15.7669 2.5 16.2334 2.68166 16.5899C2.84144 16.9035 3.09623 17.1587 3.40983 17.3185C3.766 17.5 4.23249 17.5 5.16409 17.5H9.83629C10.7679 17.5 11.2337 17.5 11.5899 17.3185C11.9035 17.1587 12.1587 16.9033 12.3185 16.5897C12.5 16.2335 12.5 15.7675 12.5 14.8359V12.5M7.5 7.5H9.8335C10.7669 7.5 11.2334 7.5 11.5899 7.68166C11.9035 7.84144 12.1587 8.09623 12.3185 8.40983C12.5 8.766 12.5 9.2325 12.5 10.1641L12.5 12.5"
      stroke="#A2A2A2"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Retry 아이콘 - 원형 화살표 (채팅 응답 재시도) */
export const RetryIcon: IconComponent = (props) => <RotateCw {...props} />;

/** Edit 아이콘 - 세션 카드 제목 편집 펜 */
export const TitleEdit: React.FC<CustomIconProps> = ({
  size = 20,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3.33594 16.6681H16.6693M3.33594 16.6681V13.3347L10.0026 6.66807M3.33594 16.6681L6.66927 16.668L13.3359 10.0014M10.0026 6.66807L12.3931 4.27752L12.3946 4.2761C12.7236 3.94703 12.8885 3.78221 13.0785 3.72047C13.2458 3.66609 13.4261 3.66609 13.5935 3.72047C13.7834 3.78216 13.948 3.9468 14.2766 4.27541L15.7264 5.72524C16.0565 6.05525 16.2215 6.22033 16.2834 6.41061C16.3377 6.57798 16.3377 6.75826 16.2833 6.92563C16.2216 7.11577 16.0567 7.2806 15.7272 7.61015L15.7265 7.61085L13.3359 10.0014M10.0026 6.66807L13.3359 10.0014"
      stroke="#BABCC7"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Pen 아이콘 - 색칠 된 펜 */
export const PenIcon: React.FC<CustomIconProps> = ({
  size = 16,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_6810_10510)">
      <path
        d="M0.781333 12.7469C0.281202 13.2469 0.000151033 13.925 0 14.6322L0 16.0009H1.36867C2.07585 16.0007 2.75402 15.7197 3.254 15.2195L12.1493 6.32422L9.67667 3.85156L0.781333 12.7469Z"
        fill="currentColor"
      />
      <path
        d="M15.4298 0.571216C15.2675 0.408706 15.0747 0.279786 14.8625 0.191827C14.6503 0.103867 14.4228 0.0585938 14.1931 0.0585938C13.9634 0.0585937 13.736 0.103867 13.5238 0.191827C13.3116 0.279786 13.1188 0.408706 12.9565 0.571216L10.6191 2.90922L13.0918 5.38188L15.4298 3.04455C15.5923 2.88221 15.7212 2.68943 15.8092 2.47723C15.8972 2.26504 15.9424 2.03759 15.9424 1.80788C15.9424 1.57818 15.8972 1.35073 15.8092 1.13853C15.7212 0.926335 15.5923 0.733556 15.4298 0.571216Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_6810_10510">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

/** 드래그 핸들 아이콘 - 2x2 점 */
export const DragHandleIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 15C14 15.5523 14.4477 16 15 16C15.5523 16 16 15.5523 16 15C16 14.4477 15.5523 14 15 14C14.4477 14 14 14.4477 14 15Z"
      stroke="#3C3C3C"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8 15C8 15.5523 8.44772 16 9 16C9.55228 16 10 15.5523 10 15C10 14.4477 9.55228 14 9 14C8.44772 14 8 14.4477 8 15Z"
      stroke="#3C3C3C"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M14 9C14 9.55228 14.4477 10 15 10C15.5523 10 16 9.55228 16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9Z"
      stroke="#3C3C3C"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8 9C8 9.55228 8.44772 10 9 10C9.55228 10 10 9.55228 10 9C10 8.44772 9.55228 8 9 8C8.44772 8 8 8.44772 8 9Z"
      stroke="#3C3C3C"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const ClientIcon: React.FC<CustomIconProps> = ({
  size = 18,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clip-path="url(#clip0_8805_82918)">
      <path
        d="M9.11133 1.57715C11.0993 1.57738 12.7109 3.18968 12.7109 5.17773C12.7107 7.16559 11.0992 8.77711 9.11133 8.77734C7.12327 8.77734 5.51098 7.16574 5.51074 5.17773C5.51074 3.18953 7.12313 1.57715 9.11133 1.57715Z"
        stroke="#BABCC7"
        stroke-width="1.35"
      />
      <path
        d="M8.99805 11.4756C13.2313 11.4794 16.3982 14.1915 16.4229 17.252C16.4202 17.2545 16.4178 17.259 16.4131 17.2627C16.378 17.2907 16.3042 17.3262 16.1982 17.3262H1.79883C1.69294 17.3262 1.61908 17.2907 1.58398 17.2627C1.57935 17.259 1.57593 17.2555 1.57324 17.2529C1.59723 14.1923 4.76471 11.4798 8.99805 11.4756Z"
        stroke="#BABCC7"
        stroke-width="1.35"
      />
    </g>
    <defs>
      <clipPath id="clip0_8805_82918">
        <rect width="18" height="18" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const TooltipIcon: React.FC<CustomIconProps> = ({
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
      d="M7 0C5.61553 0 4.26215 0.410543 3.11101 1.17971C1.95987 1.94888 1.06266 3.04213 0.532846 4.32122C0.003033 5.6003 -0.13559 7.00776 0.134506 8.36563C0.404603 9.7235 1.07129 10.9708 2.05026 11.9497C3.02922 12.9287 4.2765 13.5954 5.63437 13.8655C6.99224 14.1356 8.3997 13.997 9.67879 13.4672C10.9579 12.9373 12.0511 12.0401 12.8203 10.889C13.5895 9.73785 14 8.38447 14 7C13.998 5.1441 13.2599 3.36479 11.9475 2.05247C10.6352 0.74015 8.8559 0.0020073 7 0V0ZM7 11.6667C6.88463 11.6667 6.77185 11.6325 6.67592 11.5684C6.57999 11.5043 6.50522 11.4132 6.46107 11.3066C6.41692 11.2 6.40537 11.0827 6.42788 10.9695C6.45039 10.8564 6.50594 10.7524 6.58752 10.6709C6.6691 10.5893 6.77304 10.5337 6.8862 10.5112C6.99935 10.4887 7.11664 10.5003 7.22323 10.5444C7.32982 10.5886 7.42093 10.6633 7.48503 10.7592C7.54912 10.8552 7.58333 10.968 7.58333 11.0833C7.58333 11.238 7.52188 11.3864 7.41248 11.4958C7.30308 11.6052 7.15471 11.6667 7 11.6667ZM8.12583 7.29517C7.95369 7.4028 7.81292 7.55386 7.71769 7.73316C7.62246 7.91247 7.57612 8.11369 7.58333 8.31658V8.75C7.58333 8.90471 7.52188 9.05308 7.41248 9.16248C7.30308 9.27187 7.15471 9.33333 7 9.33333C6.84529 9.33333 6.69692 9.27187 6.58752 9.16248C6.47813 9.05308 6.41667 8.90471 6.41667 8.75V8.31658C6.40805 7.905 6.50975 7.4986 6.71121 7.13959C6.91267 6.78057 7.20654 6.48202 7.56233 6.27492C7.77786 6.15621 7.95034 5.9724 8.05511 5.74976C8.15988 5.52713 8.19158 5.27707 8.14567 5.03533C8.10021 4.80503 7.98714 4.59351 7.8209 4.42778C7.65465 4.26206 7.44277 4.14965 7.21234 4.10492C7.04417 4.07379 6.87122 4.08002 6.70573 4.12315C6.54024 4.16629 6.38626 4.24528 6.25469 4.35453C6.12312 4.46379 6.01717 4.60063 5.94436 4.75538C5.87155 4.91012 5.83364 5.07898 5.83334 5.25C5.83334 5.40471 5.77188 5.55308 5.66248 5.66248C5.55308 5.77187 5.40471 5.83333 5.25 5.83333C5.09529 5.83333 4.94692 5.77187 4.83752 5.66248C4.72813 5.55308 4.66667 5.40471 4.66667 5.25C4.66681 4.83846 4.7758 4.43428 4.98258 4.07846C5.18935 3.72264 5.48655 3.42784 5.84404 3.22396C6.20152 3.02008 6.60657 2.91437 7.0181 2.91756C7.42962 2.92075 7.83298 3.03273 8.18726 3.24213C8.54154 3.45153 8.83414 3.75091 9.03537 4.1099C9.2366 4.46888 9.3393 4.8747 9.33307 5.28619C9.32683 5.69768 9.21187 6.1002 8.99985 6.45292C8.78783 6.80564 8.4863 7.09602 8.12583 7.29458V7.29517Z"
      fill="#BABAC0"
    />
  </svg>
);

export const DeidentificationIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10.7721 17.1928C12.5273 16.3984 16.6673 13.9444 16.6673 8.47087V5.16409C16.6673 4.2325 16.6673 3.766 16.4858 3.40983C16.3261 3.09623 16.0704 2.84144 15.7568 2.68166C15.4003 2.5 14.9342 2.5 14.0008 2.5H6.00081C5.06739 2.5 4.60033 2.5 4.24382 2.68166C3.93021 2.84144 3.67543 3.09623 3.51564 3.40983C3.33398 3.76635 3.33398 4.23341 3.33398 5.16683V8.47087C3.33398 13.9444 7.47382 16.3984 9.22894 17.1928C9.41501 17.2771 9.5085 17.3191 9.7191 17.3552C9.85194 17.378 10.1502 17.378 10.283 17.3552C10.4929 17.3192 10.5854 17.2773 10.7702 17.1937L10.7721 17.1928Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.65527 13V5.22266H10.7061C12.4731 5.22266 13.4883 6.31299 13.4883 7.84375C13.4883 9.396 12.457 10.4648 10.6631 10.4648H9.2666V13H7.65527ZM9.2666 9.16504H10.4053C11.3613 9.16504 11.8286 8.62793 11.8232 7.84375C11.8286 7.07031 11.3613 6.54932 10.4053 6.54395H9.2666V9.16504Z"
      fill="currentColor"
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
      d="M18.2222 4H5.77778C4.79594 4 4 4.79594 4 5.77778V18.2222C4 19.2041 4.79594 20 5.77778 20H18.2222C19.2041 20 20 19.2041 20 18.2222V5.77778C20 4.79594 19.2041 4 18.2222 4Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 10H20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 2V6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 2V6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 내담자 아이콘 */
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
    <rect
      x="1"
      y="1"
      width="8"
      height="8"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="18.9444"
      cy="5.44444"
      r="4"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="11.9444"
      cy="18.4444"
      r="4"
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

/** 심리검사 해석 아이콘 */
export const SidePsychologyAssessmentIcon: React.FC<CustomIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 15L21 21M10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17Z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

/** AI 슈퍼비전 - 사이드 네비게이션 아이콘 (book open) */
export const SideSupervisionIcon: React.FC<CustomIconProps> = ({
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
      d="M12 9.7998V19.9998M12 19.9998L11.4185 19.1277C10.9017 18.3526 10.6426 17.9638 10.2998 17.6821C9.99512 17.4317 9.64306 17.2441 9.26569 17.1295C8.83942 17 8.36994 17 7.43073 17H4.59797C4.03901 17 3.7596 17 3.5459 16.8911C3.35774 16.7952 3.20487 16.6419 3.10899 16.4537C3 16.2398 3 15.9601 3 15.4001V6.6001C3 6.04004 3 5.75981 3.10899 5.5459C3.20487 5.35774 3.35774 5.20487 3.5459 5.10899C3.75981 5 4.03956 5 4.59961 5H7.19961C8.87977 5 9.72004 5 10.3618 5.32698C10.9263 5.6146 11.3852 6.0737 11.6729 6.63818C11.9998 7.27992 12 8.11965 12 9.7998C12 8.11965 12 7.27992 12.327 6.63818C12.6146 6.0737 13.0732 5.6146 13.6377 5.32698C14.2794 5 15.1196 5 16.7998 5H19.3998C19.9599 5 20.2401 5 20.454 5.10899C20.6422 5.20487 20.7948 5.35774 20.8906 5.5459C20.9996 5.75981 21 6.04004 21 6.6001V15.4001C21 15.9601 20.9996 16.2398 20.8906 16.4537C20.7948 16.6419 20.6425 16.7952 20.4543 16.8911C20.2406 17 19.961 17 19.402 17H16.5693C15.6301 17 15.1597 17 14.7334 17.1295C14.356 17.2441 14.0057 17.4317 13.701 17.6821C13.3568 17.965 13.096 18.3557 12.575 19.1372L12 19.9998Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 심리검사 해석 - 클라이언트 사이드바 접기/펼치기 토글 아이콘 */
export const ClientSidebarToggleIcon: React.FC<CustomIconProps> = ({
  size = 20,
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
      d="M15 4L15 20M15 4H7.2002C6.08009 4 5.51962 4 5.0918 4.21799C4.71547 4.40973 4.40973 4.71547 4.21799 5.0918C4 5.51962 4 6.08009 4 7.2002V16.8002C4 17.9203 4 18.4796 4.21799 18.9074C4.40973 19.2837 4.71547 19.5905 5.0918 19.7822C5.51921 20 6.07901 20 7.19694 20L15 20M15 4H16.8002C17.9203 4 18.4796 4 18.9074 4.21799C19.2837 4.40973 19.5905 4.71547 19.7822 5.0918C20 5.5192 20 6.079 20 7.19691L20 16.8031C20 17.921 20 18.48 19.7822 18.9074C19.5905 19.2837 19.2837 19.5905 18.9074 19.7822C18.48 20 17.921 20 16.8031 20H15"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

/** 심리검사 해석 - 클라이언트 추가 아이콘 (사람 모양) */
export const ClientSidebarAddIcon: React.FC<CustomIconProps> = ({
  size = 20,
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
      d="M15 19C15 16.7909 12.3137 15 9 15C5.68629 15 3 16.7909 3 19M19 16V13M19 13V10M19 13H16M19 13H22M9 12C6.79086 12 5 10.2091 5 8C5 5.79086 6.79086 4 9 4C11.2091 4 13 5.79086 13 8C13 10.2091 11.2091 12 9 12Z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

/** 심리검사 해석 - 분석 상태 chip 좌측 문서 아이콘 */
export const AnalysisStatusIcon: React.FC<CustomIconProps> = ({
  size = 16,
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
      d="M13 3.00087C12.9045 3 12.7973 3 12.6747 3H8.2002C7.08009 3 6.51962 3 6.0918 3.21799C5.71547 3.40973 5.40973 3.71547 5.21799 4.0918C5 4.51962 5 5.08009 5 6.2002V17.8002C5 18.9203 5 19.4801 5.21799 19.9079C5.40973 20.2842 5.71547 20.5905 6.0918 20.7822C6.51921 21 7.079 21 8.19694 21L15.8031 21C16.921 21 17.48 21 17.9074 20.7822C18.2837 20.5905 18.5905 20.2842 18.7822 19.9079C19 19.4805 19 18.9215 19 17.8036V9.32568C19 9.20296 19 9.09561 18.9991 9M13 3.00087C13.2856 3.00347 13.4663 3.01385 13.6388 3.05526C13.8429 3.10425 14.0379 3.18526 14.2168 3.29492C14.4186 3.41857 14.5918 3.59182 14.9375 3.9375L18.063 7.06298C18.4089 7.40889 18.5809 7.58136 18.7046 7.78319C18.8142 7.96214 18.8953 8.15726 18.9443 8.36133C18.9857 8.53376 18.9963 8.71451 18.9991 9M13 3.00087V5.8C13 6.9201 13 7.47977 13.218 7.90759C13.4097 8.28392 13.7155 8.59048 14.0918 8.78223C14.5192 9 15.079 9 16.1969 9H18.9991M18.9991 9H19.0002"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

/**
 * 보안/프라이버시 표시용 방패 아이콘 (공용).
 * 사용 위치: 심리검사 등록 모달 상단 안내 배너, 분석 채팅 입력 좌측 등.
 * size / className으로 크기·색상 제어.
 */
export const SecurityShieldIcon: React.FC<CustomIconProps> = ({
  size = 18,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10.0026 18.3346C10.0026 18.3346 16.6693 15.0013 16.6693 10.0013V4.16797L10.0026 1.66797L3.33594 4.16797V10.0013C3.33594 15.0013 10.0026 18.3346 10.0026 18.3346Z"
      stroke="currentColor"
      stroke-width="1.57"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="10" cy="8" r="2" fill="currentColor" />
    <path d="M10 8V13" stroke="currentColor" stroke-width="1.5" />
  </svg>
);

/** 심리검사 해석 - 채팅 입력 우측 전송 아이콘 */
export const AnalysisChatSendIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8.59111 11.4121L12.6296 7.37362M16.7607 4.90902L13.3518 15.9878C13.0464 16.9807 12.8935 17.4774 12.63 17.642C12.4015 17.7848 12.1185 17.8087 11.8696 17.7054C11.5826 17.5863 11.3496 17.1212 10.8849 16.1918L8.72579 11.8735C8.65205 11.726 8.61514 11.6526 8.56588 11.5887C8.52217 11.532 8.47172 11.4809 8.41501 11.4372C8.35256 11.3891 8.28035 11.353 8.13944 11.2825L3.81124 9.11841C2.88182 8.6537 2.41706 8.42113 2.29797 8.13412C2.19469 7.8852 2.21825 7.60198 2.36104 7.37343C2.5257 7.10991 3.02233 6.95681 4.0155 6.65122L15.0943 3.24235C15.8751 3.00211 16.2657 2.88208 16.5294 2.9789C16.7591 3.06323 16.9402 3.24416 17.0246 3.47388C17.1213 3.73748 17.0012 4.12784 16.7612 4.90786L16.7607 4.90902Z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

/** 심리검사 해석 - 결과지 초기화 (재시작/refresh) 아이콘 */
export const ResetCycleIcon: React.FC<CustomIconProps> = ({
  size = 16,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8.33447 13.3333H4.16781V17.5M11.6678 6.66667H15.8345V2.5M3.82031 7.50284C4.28755 6.34638 5.06984 5.3442 6.07826 4.61019C7.08669 3.87618 8.28185 3.4396 9.52593 3.35042C10.77 3.26125 12.0134 3.52284 13.1162 4.10551C14.219 4.68819 15.1355 5.56878 15.7629 6.64677M16.1824 12.4976C15.7152 13.654 14.9329 14.6562 13.9245 15.3902C12.9161 16.1242 11.7221 16.5602 10.478 16.6494C9.23395 16.7386 7.98953 16.477 6.88672 15.8944C5.78391 15.3117 4.86682 14.4313 4.23942 13.3533"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

/** 심리검사 해석 - 확인 모달 빨간 ! 위험 아이콘 */
export const DangerExclamationIcon: React.FC<CustomIconProps> = ({
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
    <rect width="24" height="24" rx="12" fill="#D54036" />
    <path
      d="M11.9961 7.26562V12.599M12.0625 16.599V16.7323L11.9297 16.7318V16.599H12.0625Z"
      stroke="white"
      stroke-width="2.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
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
    <rect
      x="1"
      y="1"
      width="8.88889"
      height="8.88889"
      rx="1.11111"
      stroke="currentColor"
      strokeWidth="1.5"
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

/** 크레딧 아이콘 */
export const CreditIcon: React.FC<CustomIconProps & { color?: string }> = ({
  size = 18,
  className,
  color = '#44CE4B',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_mobile)">
      <path
        d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
        fill={color}
      />
    </g>
    <defs>
      <clipPath id="clip0_mobile">
        <rect width="14" height="14" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Accesses Badge Icons (유저 권한 뱃지 아이콘)
// ─────────────────────────────────────────────────────────────────────────────

export const SeminarBagde: React.FC<CustomIconProps> = ({
  size = 60,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_6322_64558)">
      <g filter="url(#filter0_d_6322_64558)">
        <path
          d="M27.9695 6.17228C29.226 5.44687 30.774 5.44687 32.0305 6.17228L49.6202 16.3277C50.8766 17.0531 51.6506 18.3937 51.6506 19.8446V40.1554C51.6506 41.6063 50.8766 42.9469 49.6202 43.6723L32.0305 53.8277C30.774 54.5531 29.226 54.5531 27.9695 53.8277L10.3798 43.6723C9.12337 42.9469 8.34937 41.6063 8.34937 40.1554V19.8446C8.34937 18.3937 9.12337 17.0531 10.3798 16.3277L27.9695 6.17228Z"
          fill="#FFD3B2"
        />
        <path
          d="M27.7197 5.73926C29.1308 4.92464 30.8692 4.92464 32.2803 5.73926L49.8701 15.8945C51.2813 16.7093 52.1504 18.2153 52.1504 19.8447V40.1553C52.1504 41.7847 51.2813 43.2907 49.8701 44.1055L32.2803 54.2607C30.8692 55.0754 29.1308 55.0754 27.7197 54.2607L10.1299 44.1055C8.71873 43.2907 7.84961 41.7847 7.84961 40.1553V19.8447C7.84961 18.2153 8.71873 16.7093 10.1299 15.8945L27.7197 5.73926Z"
          stroke="#D6D8E1"
        />
      </g>
      <mask
        id="mask0_6322_64558"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="8"
        y="5"
        width="44"
        height="50"
      >
        <path
          d="M27.9695 6.17228C29.226 5.44687 30.774 5.44687 32.0305 6.17228L49.6202 16.3277C50.8766 17.0531 51.6506 18.3937 51.6506 19.8446V40.1554C51.6506 41.6063 50.8766 42.9469 49.6202 43.6723L32.0305 53.8277C30.774 54.5531 29.226 54.5531 27.9695 53.8277L10.3798 43.6723C9.12337 42.9469 8.34937 41.6063 8.34937 40.1554V19.8446C8.34937 18.3937 9.12337 17.0531 10.3798 16.3277L27.9695 6.17228Z"
          fill="#FFD3B2"
        />
        <path
          d="M28.9209 7.82129C29.5884 7.43591 30.4116 7.43591 31.0791 7.82129L48.668 17.9766C49.3355 18.3619 49.7471 19.074 49.7471 19.8447V40.1553C49.7471 40.926 49.3355 41.6381 48.668 42.0234L31.0791 52.1787C30.4116 52.5641 29.5884 52.5641 28.9209 52.1787L11.332 42.0234C10.6645 41.6381 10.2529 40.926 10.2529 40.1553V19.8447C10.2529 19.074 10.6645 18.3619 11.332 17.9766L28.9209 7.82129Z"
          stroke="#6C6A64"
          strokeOpacity="0.5"
          strokeWidth="3.80711"
        />
      </mask>
      <g mask="url(#mask0_6322_64558)">
        <path
          d="M27.9695 6.17228C29.226 5.44687 30.774 5.44687 32.0305 6.17228L49.6202 16.3277C50.8766 17.0531 51.6506 18.3937 51.6506 19.8446V40.1554C51.6506 41.6063 50.8766 42.9469 49.6202 43.6723L32.0305 53.8277C30.774 54.5531 29.226 54.5531 27.9695 53.8277L10.3798 43.6723C9.12337 42.9469 8.34937 41.6063 8.34937 40.1554V19.8446C8.34937 18.3937 9.12337 17.0531 10.3798 16.3277L27.9695 6.17228Z"
          fill="#62BB9B"
        />
        <path
          d="M18.0623 27.6901C18.3381 27.1121 19.1609 27.1121 19.4367 27.6901L20.7315 30.4036C20.8425 30.6362 21.0637 30.7969 21.3192 30.8306L24.3 31.2235C24.9349 31.3072 25.1892 32.0897 24.7247 32.5306L22.5441 34.6006C22.3572 34.778 22.2727 35.038 22.3197 35.2914L22.8671 38.2477C22.9837 38.8775 22.3181 39.3611 21.7552 39.0556L19.1127 37.6214C18.8862 37.4985 18.6128 37.4985 18.3863 37.6214L15.7439 39.0556C15.181 39.3611 14.5153 38.8775 14.6319 38.2477L15.1794 35.2914C15.2263 35.038 15.1418 34.778 14.9549 34.6006L12.7743 32.5306C12.3099 32.0897 12.5641 31.3072 13.199 31.2235L16.1798 30.8306C16.4354 30.7969 16.6565 30.6362 16.7675 30.4036L18.0623 27.6901Z"
          fill="white"
          fillOpacity="0.2"
        />
        <path
          d="M40.5623 27.6901C40.8381 27.1121 41.6609 27.1121 41.9367 27.6901L43.2315 30.4036C43.3425 30.6362 43.5637 30.7969 43.8192 30.8306L46.8 31.2235C47.4349 31.3072 47.6892 32.0897 47.2247 32.5306L45.0441 34.6006C44.8572 34.778 44.7727 35.038 44.8197 35.2914L45.3671 38.2477C45.4837 38.8775 44.8181 39.3611 44.2552 39.0556L41.6127 37.6214C41.3862 37.4985 41.1128 37.4985 40.8863 37.6214L38.2439 39.0556C37.681 39.3611 37.0153 38.8775 37.1319 38.2477L37.6794 35.2914C37.7263 35.038 37.6418 34.778 37.4549 34.6006L35.2743 32.5306C34.8099 32.0897 35.0641 31.3072 35.699 31.2235L38.6798 30.8306C38.9354 30.7969 39.1565 30.6362 39.2675 30.4036L40.5623 27.6901Z"
          fill="white"
          fillOpacity="0.2"
        />
        <path
          d="M29.3123 37.6901C29.5881 37.1121 30.4109 37.1121 30.6867 37.6901L31.9815 40.4036C32.0925 40.6362 32.3137 40.7969 32.5692 40.8306L35.55 41.2235C36.1849 41.3072 36.4392 42.0897 35.9747 42.5306L33.7941 44.6006C33.6072 44.778 33.5227 45.038 33.5697 45.2914L34.1171 48.2477C34.2337 48.8775 33.5681 49.3611 33.0052 49.0556L30.3627 47.6214C30.1362 47.4985 29.8628 47.4985 29.6363 47.6214L26.9939 49.0556C26.431 49.3611 25.7653 48.8775 25.8819 48.2477L26.4294 45.2914C26.4763 45.038 26.3918 44.778 26.2049 44.6006L24.0243 42.5306C23.5599 42.0897 23.8141 41.3072 24.449 41.2235L27.4298 40.8306C27.6854 40.7969 27.9065 40.6362 28.0175 40.4036L29.3123 37.6901Z"
          fill="white"
          fillOpacity="0.2"
        />
        <mask id="path-9-inside-1_6322_64558" fill="white">
          <rect x="17" y="19" width="10.5194" height="10.5194" rx="1.31501" />
        </mask>
        <rect
          x="17"
          y="19"
          width="10.5194"
          height="10.5194"
          rx="1.31501"
          stroke="white"
          strokeWidth="5.25304"
          mask="url(#path-9-inside-1_6322_64558)"
        />
        <circle
          cx="37.3535"
          cy="24.2597"
          r="3.94646"
          stroke="white"
          strokeWidth="2.62652"
        />
        <circle
          cx="30.123"
          cy="39.6543"
          r="3.94646"
          stroke="white"
          strokeWidth="2.62652"
        />
        <path
          d="M22.7969 28.6758C22.7969 29.7087 22.7969 31.7744 22.7969 31.7744H37.2573V28.6758"
          stroke="white"
          strokeWidth="2.06577"
        />
        <path
          d="M30.1875 32.1523V34.7831"
          stroke="white"
          strokeWidth="2.06577"
        />
        <path
          d="M29.0947 8.12109C29.655 7.79763 30.345 7.79763 30.9053 8.12109L48.4951 18.2764C49.0554 18.5999 49.4004 19.1977 49.4004 19.8447V40.1553C49.4004 40.8023 49.0554 41.4001 48.4951 41.7236L30.9053 51.8789C30.345 52.2024 29.655 52.2024 29.0947 51.8789L11.5049 41.7236C10.9446 41.4001 10.5996 40.8023 10.5996 40.1553V19.8447C10.5996 19.1978 10.9446 18.5999 11.5049 18.2764L29.0947 8.12109Z"
          stroke="#6C6A64"
          strokeOpacity="0.6"
          strokeWidth="4.5"
        />
        <path
          d="M28.5947 7.25488C29.4644 6.75285 30.5356 6.75285 31.4053 7.25488L48.9951 17.4102C49.8648 17.9123 50.4004 18.8405 50.4004 19.8447V40.1553C50.4004 41.1595 49.8648 42.0877 48.9951 42.5898L31.4053 52.7451C30.5356 53.2472 29.4644 53.2472 28.5947 52.7451L11.0049 42.5898C10.1352 42.0877 9.59961 41.1595 9.59961 40.1553V19.8447C9.59961 18.8405 10.1352 17.9123 11.0049 17.4102L28.5947 7.25488Z"
          stroke="white"
          strokeWidth="2.5"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_d_6322_64558"
        x="2.34766"
        y="-0.371094"
        width="55.3047"
        height="60.7422"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="2.5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.235294 0 0 0 0 0.235294 0 0 0 0 0.235294 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_6322_64558"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_6322_64558"
          result="shape"
        />
      </filter>
      <clipPath id="clip0_6322_64558">
        <rect width="60" height="60" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// ActionCard Icons (홈 화면 액션 카드 아이콘)
// ─────────────────────────────────────────────────────────────────────────────

export const UploadActionIcon: React.FC<CustomIconProps> = ({
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
    <g clipPath="url(#clip0_6043_83411)">
      <path
        d="M8.08145 5.50529L11.0074 2.57832L11.0004 18.0161C11.0004 18.5683 11.4481 19.016 12.0004 19.016C12.5526 19.016 13.0003 18.5683 13.0003 18.0161L13.0073 2.59533L15.9193 5.50829C16.3166 5.89195 16.9496 5.88099 17.3333 5.48373C17.7076 5.09622 17.7076 4.48184 17.3333 4.09433L14.1223 0.879361C12.9511 -0.292589 11.0517 -0.293198 9.87973 0.878002C9.87927 0.878471 9.87884 0.878893 9.87838 0.879361L6.66744 4.09133C6.28377 4.48859 6.29474 5.12162 6.692 5.50529C7.07951 5.87958 7.69389 5.87958 8.08145 5.50529Z"
        fill="#44CE4B"
      />
      <path
        d="M22.9996 16C22.4473 16 21.9996 16.4477 21.9996 17V20.9999C21.9996 21.5522 21.5519 21.9999 20.9996 21.9999H2.99991C2.44763 21.9999 1.99994 21.5522 1.99994 20.9999V17C1.99994 16.4477 1.55224 16 0.999969 16C0.447696 16 0 16.4477 0 17V20.9999C0 22.6567 1.34314 23.9999 2.99995 23.9999H20.9997C22.6565 23.9999 23.9996 22.6567 23.9996 20.9999V17C23.9995 16.4477 23.5518 16 22.9996 16Z"
        fill="#44CE4B"
      />
    </g>
    <defs>
      <clipPath id="clip0_6043_83411">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const AddClientActionIcon: React.FC<CustomIconProps> = ({
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
    <g clipPath="url(#clip0_6043_83415)">
      <path
        d="M23 11H21V8.99998C21 8.4477 20.5523 8 20 8C19.4477 8 19 8.4477 19 8.99998V11H17C16.4477 11 16 11.4477 16 12C16 12.5523 16.4477 13 17 13H19V15C19 15.5523 19.4477 16 20 16C20.5523 16 21 15.5523 21 15V13H23C23.5523 13 24 12.5523 24 12C24 11.4477 23.5523 11 23 11Z"
        fill="#D54036"
      />
      <path
        d="M9 12C12.3137 12 15 9.31371 15 6C15 2.68629 12.3137 0 9 0C5.68629 0 3 2.68629 3 6C3 9.31371 5.68629 12 9 12Z"
        fill="#D54036"
      />
      <path
        d="M9 14C4.03172 14.0055 0.00553125 18.0317 0 23C0 23.5523 0.447703 24 0.999984 24H17C17.5522 24 18 23.5523 18 23C17.9945 18.0317 13.9683 14.0055 9 14Z"
        fill="#D54036"
      />
    </g>
    <defs>
      <clipPath id="clip0_6043_83415">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const SessionHistoryActionIcon: React.FC<CustomIconProps> = ({
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
      d="M12 20.9982C8.1358 20.9938 5.00441 17.8624 5 13.9982V4.99823C5 4.79822 5.01298 4.59825 5.03 4.40625C3.194 5.19497 2.003 6.99998 2 8.99821V18.9982C2.00328 21.7582 4.23992 23.9949 6.99997 23.9982H13C14.9982 23.9952 16.8032 22.8041 17.592 20.9682C17.392 20.9852 17.2 20.9982 17 20.9982H12Z"
      fill="#EBAE43"
    />
    <path
      d="M21.155 3.26889L18.871 0.909906C18.6195 0.655234 18.3246 0.447625 18 0.296875V3.99686H21.66C21.5288 3.73047 21.3586 3.48508 21.155 3.26889Z"
      fill="#EBAE43"
    />
    <path
      d="M17 4.00227C17 4.55455 17.4477 5.00225 18 5.00225H21.966C21.8923 4.35294 21.6074 3.74577 21.155 3.27425L18.871 0.915266C18.3714 0.408828 17.7085 0.0956562 17 0.03125V4.00227Z"
      fill="#EBAE43"
    />
    <path
      d="M15 3.99998V0H12C9.23997 0.00332812 7.00333 2.23997 7 5.00002V14C7.00333 16.7601 9.23997 18.9967 12 19H17C19.7601 18.9967 21.9967 16.7601 22 14V6.99998H18C16.3432 6.99998 15 5.65688 15 3.99998Z"
      fill="#EBAE43"
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// SideTab Custom Icons (사이드탭 전용 커스텀 아이콘)
// ─────────────────────────────────────────────────────────────────────────────

export const SettingPageNameIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_6089_279341)">
      <path
        d="M10 0C8.02219 0 6.08879 0.58649 4.4443 1.6853C2.79981 2.78412 1.51809 4.3459 0.761209 6.17317C0.00433286 8.00043 -0.193701 10.0111 0.192152 11.9509C0.578004 13.8907 1.53041 15.6725 2.92894 17.0711C4.32746 18.4696 6.10929 19.422 8.0491 19.8079C9.98891 20.1937 11.9996 19.9957 13.8268 19.2388C15.6541 18.4819 17.2159 17.2002 18.3147 15.5557C19.4135 13.9112 20 11.9778 20 10C19.9971 7.34872 18.9426 4.80684 17.0679 2.9321C15.1932 1.05736 12.6513 0.00286757 10 0V0ZM6.66667 6.66667C7.1087 6.66667 7.53262 6.84226 7.84518 7.15482C8.15774 7.46738 8.33334 7.89131 8.33334 8.33333C8.33334 9.16667 7.5875 9.16667 6.66667 9.16667C5.74584 9.16667 5 9.16667 5 8.33333C5 7.89131 5.1756 7.46738 5.48816 7.15482C5.80072 6.84226 6.22464 6.66667 6.66667 6.66667V6.66667ZM14.7217 13.1217C13.3984 14.2521 11.7382 14.9126 10 15C8.26185 14.9126 6.60156 14.2521 5.27834 13.1217C5.11346 12.9745 5.01381 12.7678 5.00131 12.5471C4.99512 12.4379 5.01051 12.3285 5.0466 12.2251C5.0827 12.1218 5.13879 12.0266 5.21167 11.945C5.28455 11.8634 5.3728 11.7969 5.47138 11.7493C5.56996 11.7018 5.67693 11.6742 5.7862 11.668C6.00686 11.6555 6.22346 11.7311 6.38834 11.8783C7.40686 12.7351 8.67202 13.2448 10 13.3333C11.3288 13.2447 12.5946 12.7344 13.6133 11.8767C13.6951 11.8039 13.7904 11.7479 13.8937 11.712C13.9971 11.676 14.1066 11.6608 14.2158 11.6671C14.3251 11.6735 14.432 11.7013 14.5305 11.749C14.6291 11.7966 14.7172 11.8633 14.79 11.945C14.8628 12.0267 14.9187 12.122 14.9547 12.2254C14.9906 12.3288 15.0059 12.4382 14.9995 12.5475C14.9932 12.6568 14.9654 12.7637 14.9177 12.8622C14.87 12.9607 14.8034 13.0489 14.7217 13.1217V13.1217ZM13.3333 9.16667C12.4125 9.16667 11.6667 9.16667 11.6667 8.33333C11.6667 7.89131 11.8423 7.46738 12.1548 7.15482C12.4674 6.84226 12.8913 6.66667 13.3333 6.66667C13.7754 6.66667 14.1993 6.84226 14.5118 7.15482C14.8244 7.46738 15 7.89131 15 8.33333C15 9.16667 14.2542 9.16667 13.3333 9.16667Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_6089_279341">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const SettingPageEmailIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_6089_279340)">
      <path
        d="M19.9617 4.61914L12.9467 11.6341C12.1645 12.4144 11.1048 12.8525 10 12.8525C8.89521 12.8525 7.83552 12.4144 7.05333 11.6341L0.0383333 4.61914C0.0266667 4.75081 0 4.86997 0 5.00081V15.0008C0.00132321 16.1055 0.440735 17.1645 1.22185 17.9456C2.00296 18.7267 3.062 19.1662 4.16667 19.1675H15.8333C16.938 19.1662 17.997 18.7267 18.7782 17.9456C19.5593 17.1645 19.9987 16.1055 20 15.0008V5.00081C20 4.86997 19.9733 4.75081 19.9617 4.61914Z"
        fill="currentColor"
      />
      <path
        d="M11.7685 10.4557L19.3801 2.84315C19.0114 2.23175 18.4913 1.72568 17.8701 1.37376C17.2489 1.02184 16.5474 0.835935 15.8335 0.833984H4.16678C3.4528 0.835935 2.75137 1.02184 2.13014 1.37376C1.50891 1.72568 0.988849 2.23175 0.620117 2.84315L8.23179 10.4557C8.70143 10.9234 9.33727 11.186 10.0001 11.186C10.663 11.186 11.2988 10.9234 11.7685 10.4557Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_6089_279340">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const SettingPageLocationIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_6089_279342)">
      <path
        d="M10.0001 0.0351562C7.79507 0.0375822 5.68101 0.914552 4.12173 2.47368C2.56245 4.03281 1.68526 6.14678 1.68262 8.35182C1.68262 10.4935 3.34095 13.8452 6.61178 18.3135C7.00117 18.8469 7.511 19.2809 8.09979 19.5801C8.68857 19.8793 9.33968 20.0352 10.0001 20.0352C10.6606 20.0352 11.3117 19.8793 11.9004 19.5801C12.4892 19.2809 12.9991 18.8469 13.3885 18.3135C16.6593 13.8452 18.3176 10.4935 18.3176 8.35182C18.315 6.14678 17.4378 4.03281 15.8785 2.47368C14.3192 0.914552 12.2052 0.0375822 10.0001 0.0351562V0.0351562ZM10.0001 11.6668C9.34085 11.6668 8.69638 11.4713 8.14822 11.1051C7.60005 10.7388 7.17281 10.2182 6.92052 9.6091C6.66823 9.00002 6.60222 8.32979 6.73083 7.68319C6.85945 7.03659 7.17692 6.44264 7.64309 5.97647C8.10927 5.51029 8.70321 5.19282 9.34982 5.06421C9.99642 4.93559 10.6666 5.0016 11.2757 5.25389C11.8848 5.50618 12.4054 5.93343 12.7717 6.48159C13.138 7.02975 13.3335 7.67422 13.3335 8.33349C13.3335 9.21755 12.9823 10.0654 12.3571 10.6905C11.732 11.3156 10.8842 11.6668 10.0001 11.6668Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_6089_279342">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Oauth Icons (Oauth 브랜드  아이콘)
// ─────────────────────────────────────────────────────────────────────────────

export const GoogleIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const KakaoIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path
      fill="#000000"
      d="M12 3C6.48 3 2 6.44 2 10.61c0 2.68 1.78 5.03 4.46 6.36-.14.5-.91 3.22-.94 3.44 0 0-.02.16.08.22.1.06.22.01.22.01.29-.04 3.37-2.2 3.9-2.57.73.1 1.49.16 2.28.16 5.52 0 10-3.44 10-7.61C22 6.44 17.52 3 12 3z"
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
  Menu: MenuIcon,
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
  Copy: CopyIcon,

  // SideTab Custom Icons
  SideHome: SideHomeIcon,
  SideCalendar: SideCalendarIcon,
  SideClient: SideClientIcon,
  SideSession: SideSessionIcon,
  SideTemplate: SideTemplateIcon,
  SideGenogram: SideGenogramIcon,
  SideAnalysis: SideAnalysisIcon,
  SidePsychologyAssessment: SidePsychologyAssessmentIcon,
  SideSettings: SideSettingsIcon,
  SideHelp: SideHelpIcon,
  SideLock: SideLockIcon,

  // Badge Icons
  SeminarBadge: SeminarBagde,
} as const;
