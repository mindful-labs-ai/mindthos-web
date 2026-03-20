import React from 'react';

import type { TermItem } from '@/features/terms-agreement/types';
import { GoogleIcon, MailIcon } from '@/shared/icons';
import { HyperLink, Spinner, Title } from '@/shared/ui';
import { Button } from '@/shared/ui/atoms/Button';
import { Tab } from '@/shared/ui/atoms/Tab';
import { Text } from '@/shared/ui/atoms/Text';
import { Card } from '@/shared/ui/composites/Card';
import { Modal } from '@/shared/ui/composites/Modal';
import { SnackBar } from '@/shared/ui/composites/SnackBar';
import { Spotlight } from '@/shared/ui/composites/Spotlight';
import { useToast } from '@/shared/ui/composites/Toast';
import { useModalStore } from '@/stores/modalStore';
import { useQuestStore } from '@/stores/questStore';
import SignInForm from '@/widgets/auth/SignInForm';
import SignUpForm from '@/widgets/auth/SignUpForm';
import { TermsAgreementCard } from '@/widgets/terms-agreement/TermsAgreementCard';

type DebugTab =
  | 'modal'
  | 'toast'
  | 'snackbar'
  | 'spotlight'
  | 'global-modal'
  | 'pages';

const TAB_ITEMS = [
  { value: 'modal', label: 'Modal' },
  { value: 'toast', label: 'Toast' },
  { value: 'snackbar', label: 'SnackBar' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'global-modal', label: 'Global Modal' },
  { value: 'pages', label: 'Pages' },
] satisfies { value: DebugTab; label: string }[];

const GLOBAL_MODAL_TYPES = [
  'userEdit',
  'planChange',
  'createMultiSession',
  'comingSoon',
  'couponModal',
] as const;

const DebugShellPage = () => {
  const [activeTab, setActiveTab] = React.useState<DebugTab>('modal');

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="typo-xl font-headline text-fg">Shell Component Debug</h1>

      <Tab
        items={TAB_ITEMS}
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as DebugTab)}
        variant="pill"
        size="sm"
      />

      <div className="rounded-lg border border-border bg-surface">
        {activeTab === 'modal' && <ModalSection />}
        {activeTab === 'toast' && <ToastSection />}
        {activeTab === 'snackbar' && <SnackBarSection />}
        {activeTab === 'spotlight' && <SpotlightSection />}
        {activeTab === 'global-modal' && <GlobalModalSection />}
        {activeTab === 'pages' && <PagesSection />}
      </div>
    </div>
  );
};

// ── Modal ──

function ModalSection() {
  const [basicOpen, setBasicOpen] = React.useState(false);
  const [fullOpen, setFullOpen] = React.useState(false);
  const [noCloseOpen, setNoCloseOpen] = React.useState(false);
  const [longOpen, setLongOpen] = React.useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = React.useState(false);
  const [fullScreenOpen, setFullScreenOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <h2 className="typo-l font-emphasize text-fg">Modal</h2>

      <div className="flex flex-wrap gap-3">
        <Button tone="primary" onClick={() => setBasicOpen(true)}>
          Basic Modal
        </Button>
        <Button tone="secondary" onClick={() => setFullOpen(true)}>
          With Title & Description
        </Button>
        <Button tone="neutral" onClick={() => setNoCloseOpen(true)}>
          No Close Button
        </Button>
        <Button tone="accent" onClick={() => setLongOpen(true)}>
          Long Content (Scroll)
        </Button>
        <Button
          tone="primary"
          variant="outline"
          onClick={() => setBottomSheetOpen(true)}
        >
          Bottom Sheet (mobile)
        </Button>
        <Button tone="danger" onClick={() => setFullScreenOpen(true)}>
          Full Screen (mobile)
        </Button>
      </div>

      <Modal open={basicOpen} onOpenChange={setBasicOpen}>
        <p className="text-fg-secondary">Basic modal content.</p>
      </Modal>

      <Modal
        open={fullOpen}
        onOpenChange={setFullOpen}
        title="Modal Title"
        description="This is a description for the modal."
      >
        <div className="space-y-4">
          <p className="text-fg-secondary">Modal body content goes here.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFullOpen(false)}>
              Cancel
            </Button>
            <Button tone="primary" onClick={() => setFullOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={noCloseOpen}
        onOpenChange={setNoCloseOpen}
        title="No Close Button"
        hideCloseButton
        closeOnOverlay={false}
      >
        <div className="space-y-4">
          <p className="text-fg-secondary">
            Close button is hidden and overlay click is disabled.
          </p>
          <Button tone="primary" onClick={() => setNoCloseOpen(false)}>
            Close via Button
          </Button>
        </div>
      </Modal>

      <Modal open={longOpen} onOpenChange={setLongOpen} title="Long Content">
        <div className="space-y-3">
          {Array.from({ length: 30 }, (_, i) => (
            <p key={i} className="text-fg-secondary">
              Line {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing
              elit.
            </p>
          ))}
        </div>
      </Modal>

      <Modal
        open={bottomSheetOpen}
        onOpenChange={setBottomSheetOpen}
        title="Bottom Sheet"
        mobileVariant="bottomSheet"
      >
        <div className="space-y-4">
          <p className="text-fg-secondary">
            This modal appears as a bottom sheet on mobile and a center popup on
            desktop.
          </p>
          <Button tone="primary" onClick={() => setBottomSheetOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>

      <Modal
        open={fullScreenOpen}
        onOpenChange={setFullScreenOpen}
        title="Full Screen"
        mobileVariant="fullScreen"
        className="px-4 py-4"
      >
        <div className="space-y-4">
          <p className="text-fg-secondary">
            This modal takes the full screen on mobile and appears as a center
            popup on desktop.
          </p>
          <Button tone="primary" onClick={() => setFullScreenOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ── Toast ──

function ToastSection() {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <h2 className="typo-l font-emphasize text-fg">Toast</h2>

      <div className="flex flex-wrap gap-3">
        <Button tone="primary" onClick={() => toast({ title: 'Basic Toast' })}>
          Basic
        </Button>
        <Button
          tone="secondary"
          onClick={() =>
            toast({
              title: 'With Description',
              description: 'This toast has a description text.',
            })
          }
        >
          With Description
        </Button>
        <Button
          tone="accent"
          onClick={() =>
            toast({
              title: 'With Action',
              description: 'Click the action button.',
              action: {
                label: 'Undo',
                onClick: () => alert('Undo clicked'),
              },
            })
          }
        >
          With Action
        </Button>
        <Button
          tone="neutral"
          onClick={() => toast({ title: 'Persistent Toast', duration: 0 })}
        >
          No Auto-Close (duration=0)
        </Button>
        <Button
          tone="danger"
          onClick={() => {
            for (let i = 1; i <= 5; i++) {
              toast({ title: `Stacked Toast #${i}` });
            }
          }}
        >
          5x Stacked
        </Button>
      </div>
    </div>
  );
}

// ── SnackBar ──

function SnackBarSection() {
  const [basicOpen, setBasicOpen] = React.useState(false);
  const [actionOpen, setActionOpen] = React.useState(false);
  const [persistOpen, setPersistOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <h2 className="typo-l font-emphasize text-fg">SnackBar</h2>

      <div className="flex flex-wrap gap-3">
        <Button tone="primary" onClick={() => setBasicOpen(true)}>
          Basic SnackBar
        </Button>
        <Button tone="secondary" onClick={() => setActionOpen(true)}>
          With Action
        </Button>
        <Button tone="neutral" onClick={() => setPersistOpen(true)}>
          Persistent (duration=0)
        </Button>
      </div>

      <SnackBar
        open={basicOpen}
        message="This is a basic snackbar message."
        onOpenChange={setBasicOpen}
      />
      <SnackBar
        open={actionOpen}
        message="Snackbar with action button."
        action={{
          label: 'Retry',
          onClick: () => alert('Retry clicked'),
        }}
        onOpenChange={setActionOpen}
      />
      <SnackBar
        open={persistOpen}
        message="This snackbar won't auto-close."
        duration={0}
        onOpenChange={setPersistOpen}
      />
    </div>
  );
}

// ── Spotlight ──

function SpotlightSection() {
  const [active, setActive] = React.useState(false);
  const [position, setPosition] = React.useState<
    'top' | 'bottom' | 'left' | 'right'
  >('bottom');
  const clearSpotlight = useQuestStore((s) => s.clearSpotlight);

  const handleClose = React.useCallback(() => {
    setActive(false);
    clearSpotlight();
  }, [clearSpotlight]);

  return (
    <div className="space-y-4">
      <h2 className="typo-l font-emphasize text-fg">Spotlight</h2>

      <div className="flex flex-wrap gap-3">
        <Button tone="primary" onClick={() => setActive(true)}>
          Activate Spotlight
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-fg-secondary typo-sm">Position:</span>
          {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
            <Button
              key={pos}
              size="sm"
              variant={position === pos ? 'solid' : 'outline'}
              tone="neutral"
              onClick={() => setPosition(pos)}
            >
              {pos}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-center py-8">
        <Spotlight
          isActive={active}
          tooltip={`Spotlight tooltip (${position})`}
          tooltipPosition={position}
          onClose={handleClose}
        >
          <div className="bg-primary-100 text-primary-700 rounded-lg px-6 py-4">
            Spotlight Target Element
          </div>
        </Spotlight>
      </div>
    </div>
  );
}

// ── Global Modal (via modalStore) ──

function GlobalModalSection() {
  const openModal = useModalStore((s) => s.openModal);

  return (
    <div className="space-y-4">
      <h2 className="typo-l font-emphasize text-fg">
        Global Modal (modalStore)
      </h2>
      <p className="typo-sm text-fg-muted">
        These modals are rendered by GlobalModalContainer via portal.
      </p>

      <div className="flex flex-wrap gap-3">
        {GLOBAL_MODAL_TYPES.map((type) => (
          <Button
            key={type}
            tone="neutral"
            variant="outline"
            onClick={() => openModal(type)}
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ── Pages (강제 렌더링) ──

type PageCategory = 'auth' | 'error' | 'terms' | 'payment';

const PAGE_CATEGORIES = [
  { value: 'auth', label: '인증' },
  { value: 'error', label: '에러' },
  { value: 'terms', label: '약관' },
  { value: 'payment', label: '결제' },
] satisfies { value: PageCategory; label: string }[];

const MOCK_TERMS: TermItem[] = [
  {
    id: '1',
    type: 'SERVICE',
    version: '1.0',
    title: '서비스 이용약관 (필수)',
    is_required: true,
    created_at: '2024-01-01',
  },
  {
    id: '2',
    type: 'PRIVACY',
    version: '1.0',
    title: '개인정보 처리방침 (필수)',
    is_required: true,
    created_at: '2024-01-01',
  },
  {
    id: '3',
    type: 'MARKETING',
    version: '1.0',
    title: '마케팅 정보 수신 동의 (선택)',
    is_required: false,
    created_at: '2024-01-01',
  },
];

function PreviewFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="typo-m font-emphasize text-fg">{label}</h3>
      <div className="max-h-[600px] overflow-auto rounded-lg border border-border">
        {children}
      </div>
    </div>
  );
}

function PagesSection() {
  const [category, setCategory] = React.useState<PageCategory>('auth');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="typo-l font-emphasize text-fg">Pages</h2>
        <p className="typo-sm mt-1 text-fg-muted">
          페이지 UI를 복사하여 강제 렌더링합니다. 여기서 UI를 테스트한 후 실제
          컴포넌트에 적용하세요.
        </p>
      </div>

      <Tab
        items={PAGE_CATEGORIES}
        value={category}
        onValueChange={(v) => setCategory(v as PageCategory)}
        variant="pill"
        size="sm"
      />

      {category === 'auth' && <AuthPagesPreview />}
      {category === 'error' && <ErrorPagesPreview />}
      {category === 'terms' && <TermsPagesPreview />}
      {category === 'payment' && <PaymentPagesPreview />}
    </div>
  );
}

// ── Email Verification Preview (재사용) ──

function EmailVerificationPreview({
  email,
  resendMessage,
}: {
  email?: string;
  resendMessage?: string;
}) {
  if (!email) {
    return (
      <div className="flex h-[200px] items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-xl bg-grey-20 p-8">
            <Text className="text-m font-medium text-grey-100">
              잘못된 접근입니다. <br /> 로그인 페이지로 이동합니다...
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-grey-10 md:px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-80 p-4">
              <MailIcon className="h-12 w-12 text-grey-100" />
            </div>
          </div>

          <h2 className="mb-2">이메일을 확인해주세요</h2>

          <p className="mb-6 text-grey-100">
            <span className="font-medium text-grey-100">{email}</span>로 인증
            메일을 발송했습니다.
            <br />
            이메일의 링크를 클릭하여 회원가입을 완료해주세요.
          </p>

          {resendMessage && (
            <div
              className={`mb-4 rounded-md p-3 text-sm font-medium ${
                resendMessage.includes('발송')
                  ? 'bg-green-50 text-green-80'
                  : 'bg-red-20 text-red-80'
              }`}
            >
              {resendMessage}
            </div>
          )}

          <div className="space-y-3">
            <Button variant="outline" tone="neutral" className="w-full">
              인증 이메일 다시 받기
            </Button>
            <Button variant="ghost" tone="neutral" className="w-full">
              로그인 페이지로 돌아가기
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-grey-20 p-4">
            <Text className="text-muted">
              💡 이메일이 보이지 않나요?
              <br />
              스팸 메일함을 확인하거나 위 버튼을 눌러 이메일을 다시 받아보세요.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Auth Pages ──

function AuthPagesPreview() {
  const [authForm, setAuthForm] = React.useState<'signIn' | 'signUp'>('signIn');
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  return (
    <div className="space-y-8">
      {/* AuthCallbackPage */}
      {/* <PreviewFrame label="AuthCallbackPage — 로딩 중">
        <div className="flex h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-80 border-t-transparent" />
            <p className="text-grey-100">로그인 처리 중...</p>
          </div>
        </div>
      </PreviewFrame> */}

      {/* EmailVerificationPage */}
      {/* <PreviewFrame label="EmailVerificationPage — 이메일 없음 (에러)">
        <EmailVerificationPreview />
      </PreviewFrame> */}

      <PreviewFrame label="EmailVerificationPage — 기본">
        <EmailVerificationPreview email="user@example.com" />
      </PreviewFrame>

      <PreviewFrame label="EmailVerificationPage — 재발송 성공">
        <EmailVerificationPreview
          email="user@example.com"
          resendMessage="인증 이메일을 다시 발송했습니다."
        />
      </PreviewFrame>

      <PreviewFrame label="EmailVerificationPage — 재발송 실패">
        <EmailVerificationPreview
          email="user@example.com"
          resendMessage="이메일 인증에 실패했습니다. 다시 시도해주세요."
        />
      </PreviewFrame>

      {/* AuthPage 컨트롤 */}
      <div className="flex items-center gap-2">
        <span className="typo-sm text-fg-secondary">AuthPage 상태:</span>
        <Button
          size="sm"
          variant={authForm === 'signIn' ? 'solid' : 'outline'}
          tone="neutral"
          onClick={() => setAuthForm('signIn')}
        >
          로그인
        </Button>
        <Button
          size="sm"
          variant={authForm === 'signUp' ? 'solid' : 'outline'}
          tone="neutral"
          onClick={() => setAuthForm('signUp')}
        >
          회원가입
        </Button>
        <Button
          size="sm"
          variant={isGoogleLoading ? 'solid' : 'outline'}
          tone="neutral"
          onClick={() => setIsGoogleLoading((v) => !v)}
        >
          Google 로딩
        </Button>
      </div>

      <PreviewFrame
        label={`AuthPage — ${authForm === 'signIn' ? '로그인' : '회원가입'}${isGoogleLoading ? ' (Google 로딩 중)' : ''}`}
      >
        <div className="flex h-[700px] w-full">
          <div className="flex flex-1 flex-col bg-white p-6">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <img
                src="/logo_mindthos_kr.webp"
                alt="마음토스 로고"
                className="main-logo-size"
              />
            </div>

            <div className="flex flex-1 items-center justify-center md:p-8">
              <div className="w-full max-w-md">
                <div className="mb-9 flex flex-col gap-3 text-left">
                  <h1 className="text-2xl font-emphasize leading-snug text-grey-100 md:text-4xl">
                    늘 곁에있는 AI 슈퍼바이저,
                    <br />
                    <span className="font-headline text-green-80">
                      마음토스
                    </span>
                  </h1>
                  <p className="text-m font-sub text-grey-70">
                    상담사의 시간을 되찾고 성장을 돕습니다.
                  </p>
                </div>

                <div className="w-full">
                  {authForm === 'signIn' ? <SignInForm /> : <SignUpForm />}

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-grey-40" />
                    </div>
                    <div className="relative flex justify-center text-m font-sub uppercase">
                      <span className="bg-white px-2 text-grey-60">또는</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <button
                      className="flex h-12 w-full items-center justify-center rounded-md border border-grey-100 bg-white text-m font-headline transition-opacity hover:opacity-60"
                      onClick={(e) => e.preventDefault()}
                      disabled={isGoogleLoading}
                    >
                      <GoogleIcon size={20} className="mr-2" />
                      {isGoogleLoading
                        ? 'Google에 연결 중...'
                        : 'Google로 계속하기'}
                    </button>
                    {authForm === 'signUp' && (
                      <p className="mt-2 text-center text-xs text-grey-80">
                        Google로 회원가입 시 위의 약관에 대한 동의로 취급
                        됩니다.
                      </p>
                    )}
                  </div>

                  <div className="mt-10 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setAuthForm(authForm === 'signIn' ? 'signUp' : 'signIn')
                      }
                      className="text-m font-medium text-green-80 hover:opacity-80"
                    >
                      {authForm === 'signIn'
                        ? '아직 계정이 없으신가요? 회원가입하기'
                        : '이미 계정이 있으신가요? 로그인하기'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border">
              <p className="pt-6 text-start text-sm text-grey-60">
                Copyright 2025. Mindful Labs Co. Ltd. All rights reserved.
              </p>
            </div>
          </div>

          <div className="hidden flex-1 items-center bg-grey-20 lg:flex">
            <div className="mx-auto flex w-full max-w-xl flex-col gap-y-8 p-8">
              <img
                src="/auth-page-image.png"
                alt="Mindthos 플랫폼 미리보기"
                className="object-contain"
              />
              <div className="flex flex-col gap-y-3 text-center">
                <h2 className="text-2xl font-emphasize text-grey-100">
                  상담사에게 꼭 필요한 기능을 만나보세요.
                </h2>
                <p className="text-l font-sub text-grey-70">
                  막막했던 사례 개념화부터 번거로운 행정 업무까지.
                  <br />
                  마음토스는 상담사가 온전히 내담자와 자신의 성장에
                  <br />
                  집중할 수 있도록 돕는 임상 전문 AI 도구입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PreviewFrame>
    </div>
  );
}

// ── Error Pages ──

function ErrorPagesPreview() {
  return (
    <div className="space-y-8">
      <PreviewFrame label="ErrorPage — 500 오류">
        <div className="flex flex-col items-center justify-center bg-bg p-8">
          <div className="text-center">
            <h1 className="mb-4 text-6xl font-headline text-fg">500</h1>
            <Title as="h2" className="typo-2xl mb-4">
              예상치 못한 오류가 발생했습니다
            </Title>
            <p className="typo-m text-muted mb-8">
              일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
            <details className="mb-8 text-left">
              <summary className="typo-sm text-muted cursor-pointer hover:text-fg">
                오류 상세 정보
              </summary>
              <pre className="typo-xs mt-2 overflow-auto rounded-lg bg-surface-contrast p-4 text-left text-fg">
                TypeError: Cannot read properties of undefined (reading
                &apos;map&apos;)
              </pre>
            </details>
            <div className="flex justify-center gap-4">
              <HyperLink
                underline="hover"
                href="#"
                className="bg-primary-500 typo-m hover:bg-primary-600 inline-block rounded-lg px-6 py-3 font-medium text-primary-fg hover:text-primary-fg"
                onClick={(e: React.MouseEvent) => e.preventDefault()}
              >
                홈으로 돌아가기
              </HyperLink>
              <button className="border-default typo-m inline-block rounded-lg bg-surface px-6 py-3 font-medium text-fg hover:bg-surface-contrast">
                새로고침
              </button>
            </div>
          </div>
        </div>
      </PreviewFrame>

      <PreviewFrame label="NotFoundPage — 404">
        <div className="flex flex-col items-center justify-center bg-bg p-8">
          <div className="text-center">
            <h1 className="mb-4 text-6xl font-headline text-fg">404</h1>
            <Title as="h2" className="typo-2xl mb-4">
              페이지를 찾을 수 없습니다
            </Title>
            <p className="typo-m text-muted mb-8">
              요청하신 페이지가 존재하지 않거나 잘못된 경로입니다.
            </p>
            <HyperLink
              underline="hover"
              href="#"
              className="bg-primary-500 typo-m hover:bg-primary-600 inline-block rounded-lg px-6 py-3 font-medium text-primary-fg hover:text-primary-fg"
              onClick={(e: React.MouseEvent) => e.preventDefault()}
            >
              홈으로 돌아가기
            </HyperLink>
          </div>
        </div>
      </PreviewFrame>
    </div>
  );
}

// ── Terms Pages ──

function TermsPagesPreview() {
  const [agreements, setAgreements] = React.useState<Record<string, boolean>>({
    '1': false,
    '2': false,
    '3': false,
  });

  const allChecked = Object.values(agreements).every(Boolean);
  const allRequiredChecked = MOCK_TERMS.filter((t) => t.is_required).every(
    (t) => agreements[t.id]
  );

  const toggleAll = () => {
    const next = !allChecked;
    setAgreements(Object.fromEntries(MOCK_TERMS.map((t) => [t.id, next])));
  };

  const toggleOne = (termId: string) => {
    setAgreements((prev) => ({ ...prev, [termId]: !prev[termId] }));
  };

  return (
    <div className="space-y-8">
      <PreviewFrame label="TermsAgreementPage — 로딩">
        <div className="flex h-[300px] items-center justify-center bg-grey-20">
          <Spinner size="lg" />
        </div>
      </PreviewFrame>

      <PreviewFrame label="TermsAgreementPage — 에러">
        <div className="flex h-[300px] items-center justify-center bg-surface-contrast">
          <div className="text-center">
            <p className="typo-m text-muted">
              약관 정보를 불러오는 중 오류가 발생했습니다.
            </p>
            <button
              type="button"
              className="mt-2 text-m font-medium text-green-80 hover:opacity-80"
            >
              다시 시도
            </button>
          </div>
        </div>
      </PreviewFrame>

      <PreviewFrame label="TermsAgreementPage — 약관 동의 (인터랙티브)">
        <div className="flex items-center justify-center bg-surface-contrast p-4 py-8">
          <TermsAgreementCard
            terms={MOCK_TERMS}
            agreements={agreements}
            allChecked={allChecked}
            allRequiredChecked={allRequiredChecked}
            toggleAll={toggleAll}
            toggleOne={toggleOne}
            onSubmit={() => {}}
            isSubmitting={false}
            onTermDetail={() => {}}
          />
        </div>
      </PreviewFrame>

      <PreviewFrame label="TermsAgreementPage — 제출 중 (로딩)">
        <div className="flex items-center justify-center bg-surface-contrast p-4 py-8">
          <TermsAgreementCard
            terms={MOCK_TERMS}
            agreements={{ '1': true, '2': true, '3': true }}
            allChecked={true}
            allRequiredChecked={true}
            toggleAll={() => {}}
            toggleOne={() => {}}
            onSubmit={() => {}}
            isSubmitting={true}
            onTermDetail={() => {}}
          />
        </div>
      </PreviewFrame>

      <PreviewFrame label="TermsPage — 로딩">
        <div className="flex h-[300px] items-center justify-center bg-bg">
          <Spinner size="lg" />
        </div>
      </PreviewFrame>

      <PreviewFrame label="TermsPage — 에러">
        <div className="flex h-[300px] items-center justify-center bg-white">
          <div className="text-center">
            <p className="text-m font-emphasize text-grey-100">
              약관 내용을 불러오는 중 오류가 발생했습니다.
            </p>
            <button
              type="button"
              className="mt-2 text-m text-green-80 hover:opacity-80"
            >
              다시 시도
            </button>
          </div>
        </div>
      </PreviewFrame>
    </div>
  );
}

// ── Payment Pages ──

function PaymentPagesPreview() {
  return (
    <div className="space-y-8">
      <PreviewFrame label="PaymentSuccess — 플랜 업그레이드 처리 중">
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-md p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <Title className="typo-2xl font-headline">
                  플랜 업그레이드 처리 중
                </Title>
                <Text className="mt-2 text-gray-600">
                  빌링키 발급 및 결제를 처리하고 있습니다...
                </Text>
              </div>
              <Button disabled className="w-full">
                설정으로 돌아가기
              </Button>
            </div>
          </Card>
        </div>
      </PreviewFrame>

      <PreviewFrame label="PaymentSuccess — 카드 등록 처리 중">
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-md p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <Title className="typo-2xl font-headline">
                  카드 등록 처리 중
                </Title>
                <Text className="mt-2 text-gray-600">
                  빌링키를 안전하게 발급받고 있습니다...
                </Text>
              </div>
              <Button disabled className="w-full">
                설정으로 돌아가기
              </Button>
            </div>
          </Card>
        </div>
      </PreviewFrame>

      <PreviewFrame label="PaymentFail — 에러 코드 포함">
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-md p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <Title className="typo-2xl font-headline">카드 등록 실패</Title>
                <Text className="mt-2 text-gray-600">
                  카드 등록 중 오류가 발생했습니다.
                </Text>
                <Text className="typo-sm mt-1 text-gray-500">
                  에러 코드: PAY_PROCESS_CANCELED
                </Text>
              </div>
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1">
                  취소
                </Button>
                <Button className="flex-1">다시 시도</Button>
              </div>
            </div>
          </Card>
        </div>
      </PreviewFrame>

      <PreviewFrame label="PaymentFail — 에러 코드 없음">
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-md p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <Title className="typo-2xl font-headline">카드 등록 실패</Title>
                <Text className="mt-2 text-gray-600">
                  카드 등록 중 오류가 발생했습니다.
                </Text>
              </div>
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1">
                  취소
                </Button>
                <Button className="flex-1">다시 시도</Button>
              </div>
            </div>
          </Card>
        </div>
      </PreviewFrame>

      <PreviewFrame label="NoneDesktopAlert — 모바일 이용 안내">
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-lg">
            <div className="flex flex-col items-center px-4 py-6 text-center">
              <h2 className="typo-xl font-headline text-fg">
                모바일 이용 안내
              </h2>
              <p className="mt-6 text-fg">
                현재 모바일 환경에서는 녹음 파일 업로드 기능만 지원하고
                있습니다. 상담기록, AI 수퍼비전 등 마음토스의 다른 기능을
                사용하기 위해서는 PC 환경에서 로그인해주세요.
              </p>
              <div className="mt-8 flex w-full items-center gap-3">
                <Button
                  variant="ghost"
                  tone="neutral"
                  className="flex-1 text-fg-muted"
                >
                  다시 보지 않기
                </Button>
                <Button variant="solid" tone="primary" className="flex-1">
                  확인
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PreviewFrame>
    </div>
  );
}

export default DebugShellPage;
