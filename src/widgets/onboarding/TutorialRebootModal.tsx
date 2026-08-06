import React from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle, Play } from 'lucide-react';

import {
  COHORT_BRANCH,
  type CohortBranch,
} from '@/features/onboarding/constants/cohort';
import {
  getCohortMissionFlow,
  isVideoMission,
  MISSION_TYPE,
  requiresMinimumVideoWatch,
  type MissionStepConfig,
} from '@/features/onboarding/constants/missionFlow';
import {
  getCohortFromTutorialStep,
  getTutorialStage,
  TutorialStep,
} from '@/features/onboarding/constants/tutorialStep';
import { readTutorialHasRecord } from '@/features/onboarding/constants/tutorialStorage';
import {
  COHORT_TUTORIAL_CLIENT,
  EXAMPLE_MIN_SECONDS,
  GUIDE_VIDEO_SOURCES,
  STEP_COMPLETE_COPY,
  TUTORIAL_FAKE_FILE_SIZE_BYTES,
  TUTORIAL_MISSION_COPY,
  TUTORIAL_RECOMMENDED_NOTE_TEMPLATES_BY_COHORT,
  VIDEO_MIN_SECONDS,
} from '@/features/onboarding/constants/tutorialUi';
import type { MultiFileInfo } from '@/features/session/types';
import { cn } from '@/lib/cn';
import { getCohortSurveyStatus } from '@/shared/api/server/acquisitionServerApi';
import { tutorialQueryKeys } from '@/shared/api/services/tutorial/constants';
import { tutorialService } from '@/shared/api/services/tutorial/tutorialService';
import type {
  TutorialState,
  TutorialVirtualClient,
} from '@/shared/api/services/tutorial/types';
import { templateService } from '@/shared/api/supabase/templateQueries';
import {
  creditQueryKeys,
  sessionQueryKeys,
  templateQueryKeys,
} from '@/shared/constants/queryKeys';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';
import { CreateMultiSessionModal } from '@/widgets/session/CreateMultiSessionModal';

interface TutorialContext {
  state: TutorialState;
  cohort: CohortBranch | null;
  hasRecord: boolean | null;
}

export interface TutorialTemplate {
  id: number;
  title: string;
  description: string;
  category?: 'SUBMISSION' | 'CASE_CONCEPTUALIZATION';
}

function getTutorialContextKey(state: TutorialState): CohortBranch | null {
  return getCohortFromTutorialStep(state.tutorial_step);
}

function adaptHasRecordValue(
  value: 'TRUE' | 'FALSE' | null | undefined
): boolean | null {
  if (value === 'TRUE') return true;
  if (value === 'FALSE') return false;
  return null;
}

async function loadTutorialContext(): Promise<TutorialContext> {
  const state = await tutorialService.current();
  const surveyStatus = await getCohortSurveyStatus().catch(() => null);
  const stateCohort = getTutorialContextKey(state);

  // The server may expose the first step before enrollment. Status is the
  // source of truth for whether the tutorial has actually started.
  if (state.status !== 'NOT_STARTED') {
    return {
      state,
      cohort: stateCohort ?? surveyStatus?.cohort ?? null,
      hasRecord: adaptHasRecordValue(surveyStatus?.has_record),
    };
  }

  const enrolled = await tutorialService.enroll();
  return {
    state: enrolled,
    cohort:
      getTutorialContextKey(enrolled) ??
      surveyStatus?.cohort ??
      COHORT_BRANCH.GENERIC,
    hasRecord: adaptHasRecordValue(surveyStatus?.has_record),
  };
}

function getMissionForStep(
  cohort: CohortBranch | null,
  tutorialStep: TutorialStep | null
): MissionStepConfig | null {
  if (!cohort || !tutorialStep) return null;

  const stage = getTutorialStage(cohort, tutorialStep);
  return (
    getCohortMissionFlow(cohort).find((mission) => mission.stage === stage) ??
    null
  );
}

function getVirtualClientKey(
  cohort: CohortBranch
): 'LEE_YOUNGSUK' | 'JUNG_SUA' {
  return cohort === COHORT_BRANCH.GENOGRAM
    ? COHORT_TUTORIAL_CLIENT.GENOGRAM
    : COHORT_TUTORIAL_CLIENT.DEFAULT;
}

function getExampleRoute(
  variant: string,
  virtualClient: TutorialVirtualClient
): string {
  const session = virtualClient.sessions.find(
    (item) => item.session_number === 1
  );
  const clientId = virtualClient.client.id;

  if (variant === 'AI_SUPERVISION') {
    return `/ai-supervision?clientId=${encodeURIComponent(clientId)}`;
  }
  if (variant === 'GENOGRAM') {
    return `/genogram?clientId=${encodeURIComponent(clientId)}`;
  }
  if (!session) {
    throw new Error('예시 상담 기록을 찾을 수 없어요.');
  }
  return `/sessions/${session.id}`;
}

const TemplateCard = ({
  template,
  selected,
  onSelect,
}: {
  template: TutorialTemplate;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onSelect}
    className={cn(
      'flex min-h-[164px] flex-col rounded-2xl border bg-surface p-6 text-left transition-colors',
      selected
        ? 'border-primary ring-1 ring-inset ring-primary'
        : 'border-border lg:hover:border-primary'
    )}
  >
    <h4 className="typo-m font-headline text-fg">{template.title}</h4>
    <p className="typo-sm mt-3 line-clamp-3 text-fg-muted">
      {template.description}
    </p>
    <span
      className={cn(
        'mt-auto flex size-6 items-center justify-center self-end rounded-full',
        selected ? 'bg-primary text-primary-fg' : 'bg-surface-strong text-white'
      )}
      aria-hidden="true"
    >
      <Check size={14} strokeWidth={3} />
    </span>
  </button>
);

export const TutorialContent = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => {
  const lines = content.split(/\/n|\n/);

  return (
    <div className={cn('whitespace-pre-line', className)}>
      {lines.map((line, lineIndex) => {
        const parts = line.trim().split(/(<주황색>.*?<\/주황색>)/g);

        return (
          <React.Fragment key={`${line}-${lineIndex}`}>
            {parts.map((part, partIndex) => {
              const isOrange =
                part.startsWith('<주황색>') && part.endsWith('</주황색>');

              return isOrange ? (
                <span key={`${part}-${partIndex}`} className="text-orange-100">
                  {part.replace('<주황색>', '').replace('</주황색>', '')}
                </span>
              ) : (
                <React.Fragment key={`${part}-${partIndex}`}>
                  {part}
                </React.Fragment>
              );
            })}
            {lineIndex < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const VideoMission = ({
  source,
  content,
  canContinue,
  minimumWatchSeconds,
  onTimeUpdate,
}: {
  source?: string;
  content: string;
  canContinue: boolean;
  minimumWatchSeconds: number;
  onTimeUpdate: (currentTime: number) => void;
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // 브라우저 자동재생 정책에 소리가 차단되면 음소거로 재시도한다.
    try {
      const playAttempt: Promise<void> | undefined = video.play();
      void playAttempt?.catch(() => {
        video.muted = true;
        void video.play()?.catch(() => undefined);
      });
    } catch {
      // play를 지원하지 않는 환경(jsdom 등)에서는 무시한다.
    }
  }, [source]);

  React.useEffect(() => {
    if (source || minimumWatchSeconds === 0) return;

    // 영상 원본이 전달되기 전에도 버튼 카운트다운을 확인할 수 있게 한다.
    let elapsedSeconds = 0;
    const timer = window.setInterval(() => {
      elapsedSeconds += 1;
      onTimeUpdate(elapsedSeconds);
      if (elapsedSeconds >= minimumWatchSeconds) {
        window.clearInterval(timer);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [minimumWatchSeconds, onTimeUpdate, source]);

  return (
    <div className="flex h-full min-h-[380px] flex-col items-center justify-center gap-5">
      <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
        {source ? (
          <video
            ref={videoRef}
            className="h-full max-h-[430px] w-full rounded-2xl border border-border bg-surface-contrast object-contain"
            autoPlay
            loop
            controls
            playsInline
            onTimeUpdate={(event) =>
              onTimeUpdate(event.currentTarget.currentTime)
            }
            src={source}
          >
            <track
              kind="captions"
              label="한국어 자막"
              src="/tutorial/placeholder.vtt"
              srcLang="ko"
            />
          </video>
        ) : (
          <div
            data-testid="tutorial-video-placeholder"
            className="flex aspect-video max-h-full w-full items-center justify-center rounded-2xl border border-border bg-surface-contrast"
          >
            <div className="flex flex-col items-center gap-4 text-fg-muted">
              <Play className="size-12" strokeWidth={1.5} />
              <span className="typo-xl font-headline text-danger">
                마음토스_가이드_영상
              </span>
              <span className="typo-sm">영상 전달 후 src만 교체됩니다.</span>
            </div>
          </div>
        )}
      </div>
      <TutorialContent
        content={content}
        className="typo-m shrink-0 text-center leading-relaxed text-fg"
      />
      <span className="sr-only" aria-live="polite">
        {canContinue
          ? '튜토리얼 완료 버튼이 활성화되었습니다.'
          : '영상 재생 중'}
      </span>
    </div>
  );
};

export const ExampleMission = ({
  content,
  onOpenExample,
  disabled = false,
}: {
  content: string;
  onOpenExample: () => void;
  disabled?: boolean;
}) => {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center gap-8">
      <div className="flex size-28 items-center justify-center rounded-full bg-primary-subtle text-primary">
        <Play className="size-12" />
      </div>
      <TutorialContent
        content={content}
        className="typo-m text-center leading-relaxed text-fg"
      />
      <Button
        tone="primary"
        size="lg"
        disabled={disabled}
        onClick={onOpenExample}
      >
        예시 보러가기
      </Button>
    </div>
  );
};

export const NoteMission = ({
  cohort,
  templates,
  selectedTemplateId,
  isLoading,
  onSelect,
}: {
  cohort: CohortBranch;
  templates: TutorialTemplate[];
  selectedTemplateId: number | null;
  isLoading: boolean;
  onSelect: (templateId: number) => void;
}) => {
  const recommendationConfig =
    TUTORIAL_RECOMMENDED_NOTE_TEMPLATES_BY_COHORT[cohort];
  const recommendedTemplateIds = new Set<number>(
    recommendationConfig.map((template) => template.id)
  );
  const templateById = new Map(
    templates.map((template) => [template.id, template])
  );
  const recommended = recommendationConfig.flatMap(({ id, title }) => {
    const template = templateById.get(id);
    return template ? [{ ...template, title }] : [];
  });
  const submission = templates.filter(
    (template) => !recommendedTemplateIds.has(template.id)
  );
  const groups = [
    { title: '추천하는 양식', items: recommended },
    { title: '다른 상담노트 양식', items: submission },
  ].filter((group) => group.items.length > 0);

  return (
    <div
      data-testid="tutorial-note-template-container"
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface-contrast p-6 sm:p-8"
    >
      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center text-fg-muted">
          <LoaderCircle className="size-6 animate-spin" />
        </div>
      ) : groups.length > 0 ? (
        <div
          data-testid="tutorial-note-template-list"
          className="min-h-0 flex-1 space-y-8 overflow-y-auto"
        >
          {groups.map((group) => (
            <section key={group.title}>
              <h4 className="typo-l mb-4 font-headline text-fg">
                {group.title}
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                {group.items.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedTemplateId === template.id}
                    onSelect={() => onSelect(template.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex min-h-48 items-center justify-center text-center text-fg-muted">
          상담노트 양식을 불러오는 중이에요.
        </div>
      )}
    </div>
  );
};

export const TutorialCompletionModal = ({
  step,
  onClose,
  onNext,
}: {
  step: TutorialStep | null;
  onClose: () => void;
  onNext: () => void;
}) => {
  if (!step) return null;
  const copy = STEP_COMPLETE_COPY[step];

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      className="w-full max-w-[512px] border-none p-0"
    >
      <div className="flex flex-col items-center px-8 py-10 text-center">
        <h2 className="typo-xl font-headline text-fg">{copy.title}</h2>
        <p className="typo-l mt-10 whitespace-pre-line font-headline text-fg">
          {copy.subtitle}
        </p>
        <p className="typo-sm mt-5 whitespace-pre-line leading-relaxed text-fg-muted">
          {copy.content}
        </p>
        <Button
          tone="primary"
          size="lg"
          className="mt-10 w-full font-headline"
          onClick={onNext}
        >
          {copy.nextLabel}
        </Button>
      </div>
    </Modal>
  );
};

export const TutorialRewardModal = ({
  onClose,
  onClaim,
  isLoading,
}: {
  onClose: () => void;
  onClaim: () => void;
  isLoading: boolean;
}) => (
  <Modal
    open
    onOpenChange={(open) => !open && onClose()}
    className="w-full max-w-[512px] border-none p-0"
  >
    <div className="flex flex-col items-center px-8 py-10 text-center">
      <h2 className="typo-xl font-headline text-fg">튜토리얼 완료!</h2>
      <p className="typo-l mt-10 font-headline leading-relaxed text-fg">
        축하합니다!
        <br />
        모든 튜토리얼을 완료했어요
      </p>
      <p className="typo-sm mt-5 leading-relaxed text-fg-muted">
        작은 선물로{' '}
        <span className="text-primary">스타터 플랜 1주일 체험권</span>을
        준비했어요.
        <br />
        앞으로 7일간 마음토스를 자유롭게 사용해보세요!
      </p>
      <Button
        tone="primary"
        size="lg"
        className="mt-10 w-full font-headline"
        disabled={isLoading}
        onClick={onClaim}
      >
        {isLoading ? '보상 적용 중...' : '지금 이벤트 보상 받기'}
      </Button>
    </div>
  </Modal>
);

export const TutorialRebootModal: React.FC = () => {
  const tutorialGuideLevel = useQuestStore((state) => state.tutorialGuideLevel);
  const setTutorialGuideLevel = useQuestStore(
    (state) => state.setTutorialGuideLevel
  );
  const tutorialRewardOpen = useQuestStore((state) => state.tutorialRewardOpen);
  const setTutorialRewardOpen = useQuestStore(
    (state) => state.setTutorialRewardOpen
  );
  const setDefaultTemplateId = useAuthStore(
    (state) => state.setDefaultTemplateId
  );
  const userId = useAuthStore((state) => state.userId);
  const { navigateWithUtm } = useNavigateWithUtm();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isOpen = tutorialGuideLevel !== null;
  const [completionStep, setCompletionStep] =
    React.useState<TutorialStep | null>(null);
  const [videoReady, setVideoReady] = React.useState(false);
  const [videoElapsedSeconds, setVideoElapsedSeconds] = React.useState(0);
  const [noteVideoMode, setNoteVideoMode] = React.useState(false);
  const [sessionUploadOpen, setSessionUploadOpen] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    number | null
  >(null);
  const [directUploadState, setDirectUploadState] = React.useState<
    'idle' | 'loading' | 'ready' | 'processing'
  >('idle');
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isRewardClaiming, setIsRewardClaiming] = React.useState(false);
  const exampleCompletionTimer = React.useRef<number | null>(null);
  const resetStepRef = React.useRef<TutorialStep | null>(null);

  const tutorialQuery = useQuery({
    queryKey: tutorialQueryKeys.current(),
    queryFn: loadTutorialContext,
    enabled: isOpen,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: false,
  });
  const activeStep = tutorialQuery.data?.state.tutorial_step ?? null;
  const cohort =
    tutorialQuery.data?.cohort ?? getCohortFromTutorialStep(activeStep);
  const mission = getMissionForStep(cohort, activeStep);
  const baseMissionCopy = activeStep
    ? TUTORIAL_MISSION_COPY[activeStep]
    : undefined;
  const missionCopy =
    noteVideoMode && baseMissionCopy?.afterAction
      ? baseMissionCopy.afterAction
      : baseMissionCopy;
  const isNoteVideo = mission?.type === MISSION_TYPE.NOTE && noteVideoMode;
  const minimumWatchSeconds =
    mission && requiresMinimumVideoWatch(mission.type) ? VIDEO_MIN_SECONDS : 0;
  const canContinueVideo = minimumWatchSeconds === 0 || videoReady;
  const remainingWatchSeconds = Math.max(
    0,
    minimumWatchSeconds - videoElapsedSeconds
  );
  const handleVideoTimeUpdate = React.useCallback(
    (currentTime: number) => {
      const elapsedSeconds = Math.floor(currentTime);
      setVideoElapsedSeconds((elapsed) => Math.max(elapsed, elapsedSeconds));
      setVideoReady((ready) => ready || currentTime >= minimumWatchSeconds);
    },
    [minimumWatchSeconds]
  );

  const templatesQuery = useQuery({
    queryKey: templateQueryKeys.list(),
    queryFn: async () => {
      const response = await templateService.getTemplates();
      return response.templates as TutorialTemplate[];
    },
    enabled: isOpen && mission?.type === MISSION_TYPE.NOTE,
    staleTime: 5 * 60 * 1000,
  });

  const setDefaultTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      if (!userId) throw new Error('사용자 정보를 찾을 수 없어요.');
      return templateService.setDefaultTemplate({
        user_id: userId,
        template_id: templateId,
      });
    },
    onSuccess: (_, templateId) => setDefaultTemplateId(templateId),
  });

  const virtualClientsQuery = useQuery({
    queryKey: tutorialQueryKeys.virtualClients(),
    queryFn: tutorialService.virtualClients,
    enabled:
      isOpen &&
      !!mission &&
      (mission.type === MISSION_TYPE.EXAMPLE ||
        mission.type === MISSION_TYPE.CLIENT_AUDIO),
    staleTime: 5 * 60 * 1000,
  });

  const virtualClient = React.useMemo(() => {
    if (!cohort) return undefined;
    const key = getVirtualClientKey(cohort);
    return virtualClientsQuery.data?.virtual_clients.find(
      (client) => client.key === key
    );
  }, [cohort, virtualClientsQuery.data?.virtual_clients]);
  const requiresVirtualClient =
    mission?.type === MISSION_TYPE.EXAMPLE ||
    mission?.type === MISSION_TYPE.CLIENT_AUDIO;
  const virtualClientError =
    requiresVirtualClient &&
    (virtualClientsQuery.isError ||
      (virtualClientsQuery.isSuccess && !virtualClient))
      ? '가상 내담자 데이터를 불러오지 못했어요.'
      : null;

  const tutorialFiles = React.useMemo<MultiFileInfo[]>(() => {
    if (directUploadState !== 'ready' && directUploadState !== 'processing') {
      return [];
    }

    const fourthSession = virtualClient?.sessions.find(
      (session) => session.session_number === 4
    );
    const fileName = `${virtualClient?.client.name ?? '가상 내담자'} 4회기.mp3`;
    const file = new File(
      [new Uint8Array(TUTORIAL_FAKE_FILE_SIZE_BYTES)],
      fileName,
      { type: 'audio/mpeg' }
    );

    return [
      {
        id: `tutorial-session-4-${fourthSession?.id ?? 'prepared'}`,
        file,
        name: fileName,
        size: file.size,
        validationStatus: 'valid',
      },
    ];
  }, [directUploadState, virtualClient]);

  React.useEffect(() => {
    if (!isOpen) {
      resetStepRef.current = null;
      return;
    }
    if (!activeStep || resetStepRef.current === activeStep) return;

    resetStepRef.current = activeStep;
    setVideoReady(false);
    setVideoElapsedSeconds(0);
    setNoteVideoMode(false);
    setSelectedTemplateId(null);
    setSessionUploadOpen(false);
    setDirectUploadState('idle');
    setActionError(null);
  }, [activeStep, isOpen]);

  React.useEffect(() => {
    if (!sessionUploadOpen) {
      // 업로드 모달을 닫은 뒤 가상 파일 상태가 남으면
      // 다음 진입 시 실제 파일 선택 입력이 숨겨질 수 있다.
      setDirectUploadState('idle');
    }
  }, [sessionUploadOpen]);

  React.useEffect(() => {
    return () => {
      if (exampleCompletionTimer.current !== null) {
        window.clearTimeout(exampleCompletionTimer.current);
      }
    };
  }, []);

  const handleClose = () => {
    resetStepRef.current = null;
    setVideoReady(false);
    setVideoElapsedSeconds(0);
    setTutorialGuideLevel(null);
    setNoteVideoMode(false);
    setSessionUploadOpen(false);
    setActionError(null);
  };

  const handleClaimReward = async () => {
    setIsRewardClaiming(true);
    try {
      await tutorialService.claimReward();
      await queryClient.invalidateQueries({ queryKey: tutorialQueryKeys.all });
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: creditQueryKeys.summary(Number(userId)),
        });
      }
      setTutorialRewardOpen(false);
      toast({
        title: '보상 수령 완료! 🎁',
        description: 'Starter 플랜 500 크레딧이 7일 동안 적용됐어요.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '보상을 적용하지 못했어요.';
      toast({ title: '보상 수령 실패', description: message });
    } finally {
      setIsRewardClaiming(false);
    }
  };

  const finishStep = async () => {
    if (!activeStep || !cohort) return false;
    const stage = getTutorialStage(cohort, activeStep);
    await tutorialService.progress({ tutorial_step: activeStep });
    if (stage === 4) {
      await tutorialService.complete();
    }
    await queryClient.invalidateQueries({
      queryKey: tutorialQueryKeys.all,
      refetchType: 'all',
    });
    setTutorialGuideLevel(null);

    if (stage === 4) {
      setCompletionStep(null);
      setTutorialRewardOpen(true);
      return true;
    }

    setCompletionStep(activeStep);
    return true;
  };

  const handlePrimaryAction = async () => {
    if (!activeStep || !mission || !cohort) return;
    setActionError(null);

    try {
      if (
        (isVideoMission(mission.type) ||
          mission.type === MISSION_TYPE.CLIENT_AUDIO ||
          isNoteVideo) &&
        !canContinueVideo
      ) {
        return;
      }

      if (requiresVirtualClient && !virtualClient) {
        if (virtualClientsQuery.isLoading) return;
        throw new Error('가상 내담자 데이터를 불러오지 못했어요.');
      }

      if (mission.type === MISSION_TYPE.NOTE) {
        if (!selectedTemplateId) return;
        if (!noteVideoMode) {
          await setDefaultTemplateMutation.mutateAsync(selectedTemplateId);
          setNoteVideoMode(true);
          setVideoReady(false);
          setVideoElapsedSeconds(0);
          return;
        }
      }

      if (mission.type === MISSION_TYPE.EXAMPLE) {
        if (exampleCompletionTimer.current !== null) return;
        if (!virtualClient) {
          throw new Error('가상 내담자 데이터를 불러오지 못했어요.');
        }

        setTutorialGuideLevel(null);
        navigateWithUtm(getExampleRoute(mission.variant, virtualClient));
        exampleCompletionTimer.current = window.setTimeout(() => {
          exampleCompletionTimer.current = null;
          void finishStep().catch((error) => {
            const message =
              error instanceof Error
                ? error.message
                : '튜토리얼 진행에 실패했어요.';
            setActionError(message);
            toast({
              title: '튜토리얼을 진행하지 못했어요.',
              description: message,
            });
          });
        }, EXAMPLE_MIN_SECONDS * 1000);
        return;
      }

      if (mission.type === MISSION_TYPE.CLIENT_AUDIO) {
        setSessionUploadOpen(true);
        return;
      }

      await finishStep();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '튜토리얼 진행에 실패했어요.';
      setActionError(message);
      toast({ title: '튜토리얼을 진행하지 못했어요.', description: message });
    }
  };

  const handleDirectUpload = async () => {
    setDirectUploadState('loading');
    setActionError(null);
    try {
      await tutorialService.directVirtualSessionUpload();
      setDirectUploadState('ready');
    } catch (error) {
      setDirectUploadState('idle');
      const message =
        error instanceof Error ? error.message : '파일을 준비하지 못했어요.';
      setActionError(message);
    }
  };

  const handleTutorialUploadComplete = async () => {
    setActionError(null);
    try {
      const userIdNum = Number(userId);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: tutorialQueryKeys.virtualClients(),
          refetchType: 'all',
        }),
        Number.isNaN(userIdNum)
          ? Promise.resolve()
          : queryClient.invalidateQueries({
              queryKey: sessionQueryKeys.all(userIdNum),
              refetchType: 'all',
            }),
      ]);
      setSessionUploadOpen(false);
      await finishStep();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '튜토리얼 진행에 실패했어요.';
      setActionError(message);
      toast({ title: '튜토리얼을 진행하지 못했어요.', description: message });
    }
  };

  const handleCompletionNext = async () => {
    if (!completionStep || !cohort) return;
    const stage = getTutorialStage(cohort, completionStep);
    if (!stage) return;
    setCompletionStep(null);

    if (stage === 4) {
      try {
        await tutorialService.complete();
        await queryClient.invalidateQueries({
          queryKey: tutorialQueryKeys.all,
          refetchType: 'all',
        });
        setTutorialGuideLevel(null);
        setTutorialRewardOpen(true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : '튜토리얼 완료에 실패했어요.';
        setActionError(message);
        toast({ title: '튜토리얼을 완료하지 못했어요.', description: message });
      }
      return;
    }

    setTutorialGuideLevel(stage + 1);
  };

  if (tutorialRewardOpen) {
    return (
      <TutorialRewardModal
        onClose={() => setTutorialRewardOpen(false)}
        onClaim={() => void handleClaimReward()}
        isLoading={isRewardClaiming}
      />
    );
  }

  if (completionStep) {
    return (
      <TutorialCompletionModal
        step={completionStep}
        onClose={() => setCompletionStep(null)}
        onNext={() => void handleCompletionNext()}
      />
    );
  }

  const isLoading = tutorialQuery.isLoading || !mission || !activeStep;
  const hasRecord = tutorialQuery.data?.hasRecord ?? readTutorialHasRecord();
  const primaryLabel =
    requiresVirtualClient && !virtualClient && !virtualClientError
      ? '불러오는 중...'
      : minimumWatchSeconds > 0 && !canContinueVideo
        ? `${remainingWatchSeconds}초 후 건너뛰기`
        : (missionCopy?.buttonText ?? '다음');
  const primaryDisabled =
    isLoading ||
    (requiresVirtualClient && !virtualClient) ||
    (mission &&
      (isVideoMission(mission.type) ||
        mission.type === MISSION_TYPE.CLIENT_AUDIO) &&
      !canContinueVideo) ||
    (isNoteVideo && !canContinueVideo) ||
    (mission?.type === MISSION_TYPE.NOTE &&
      !selectedTemplateId &&
      !noteVideoMode);

  const shouldShowSessionUpload =
    isOpen && sessionUploadOpen && mission?.type === MISSION_TYPE.CLIENT_AUDIO;

  return (
    <>
      <CreateMultiSessionModal
        open={shouldShowSessionUpload}
        onOpenChange={setSessionUploadOpen}
        tutorial={{
          files: tutorialFiles,
          clientName: virtualClient?.client.name ?? '가상 내담자',
          clientId: virtualClient?.client.id,
          isRecordUnavailable: hasRecord === false,
          directUploadState,
          onDirectUpload: () => void handleDirectUpload(),
          onRemoveUploadedFile: () => setDirectUploadState('idle'),
          onComplete: handleTutorialUploadComplete,
        }}
      />
      <Modal
        open={isOpen && !shouldShowSessionUpload}
        onOpenChange={(open) => !open && handleClose()}
        scrollableBody={false}
        className="h-[min(848px,90vh)] max-h-[90vh] w-[872px] max-w-[calc(100vw-2rem)] border-none p-0"
      >
        <div className="flex min-h-0 flex-1 flex-col px-5 py-7 sm:px-10 sm:py-8 md:px-14">
          <header className="shrink-0 text-center">
            <h2 className="typo-xl font-headline text-fg">
              튜토리얼 {mission?.stage ?? tutorialGuideLevel ?? 1}단계. 가이드
            </h2>
            <p className="typo-m mt-5 font-headline text-primary">
              {missionCopy?.subtitle ?? '마음토스 튜토리얼'}
            </p>
          </header>

          <div
            className={cn(
              'mt-7 min-h-0 flex-1',
              mission?.type === MISSION_TYPE.NOTE && !noteVideoMode
                ? 'flex flex-col overflow-hidden'
                : 'overflow-y-auto'
            )}
          >
            {tutorialQuery.isLoading ? (
              <div className="flex h-full min-h-[380px] items-center justify-center text-fg-muted">
                <LoaderCircle className="size-8 animate-spin" />
              </div>
            ) : tutorialQuery.isError || !mission || !cohort ? (
              <div className="flex h-full min-h-[380px] items-center justify-center text-center text-fg-muted">
                튜토리얼 정보를 불러오지 못했어요.
              </div>
            ) : isVideoMission(mission.type) ? (
              <VideoMission
                source={
                  GUIDE_VIDEO_SOURCES[
                    activeStep ?? TutorialStep.GENERIC_STAGE_1
                  ]
                }
                content={missionCopy?.content ?? ''}
                canContinue={canContinueVideo}
                minimumWatchSeconds={minimumWatchSeconds}
                onTimeUpdate={handleVideoTimeUpdate}
              />
            ) : isNoteVideo ? (
              <VideoMission
                source={
                  GUIDE_VIDEO_SOURCES[
                    activeStep ?? TutorialStep.GENERIC_STAGE_3
                  ]
                }
                content={missionCopy?.content ?? ''}
                canContinue={canContinueVideo}
                minimumWatchSeconds={minimumWatchSeconds}
                onTimeUpdate={handleVideoTimeUpdate}
              />
            ) : mission.type === MISSION_TYPE.EXAMPLE ? (
              <ExampleMission
                content={missionCopy?.content ?? ''}
                disabled={!virtualClient}
                onOpenExample={() => void handlePrimaryAction()}
              />
            ) : mission.type === MISSION_TYPE.NOTE ? (
              <NoteMission
                cohort={cohort}
                templates={templatesQuery.data ?? []}
                selectedTemplateId={selectedTemplateId}
                isLoading={templatesQuery.isLoading}
                onSelect={setSelectedTemplateId}
              />
            ) : mission.type === MISSION_TYPE.CLIENT_AUDIO ? (
              <VideoMission
                source={
                  GUIDE_VIDEO_SOURCES[
                    activeStep ?? TutorialStep.GENERIC_STAGE_4
                  ]
                }
                content={missionCopy?.content ?? ''}
                canContinue={canContinueVideo}
                minimumWatchSeconds={minimumWatchSeconds}
                onTimeUpdate={handleVideoTimeUpdate}
              />
            ) : null}
            {mission?.type === MISSION_TYPE.NOTE && !noteVideoMode && (
              <TutorialContent
                content={missionCopy?.content ?? ''}
                className="typo-m mt-3 shrink-0 text-center leading-relaxed text-grey-100"
              />
            )}
          </div>

          <p className="typo-sm mt-6 min-h-5 shrink-0 text-center text-danger">
            {actionError ?? virtualClientError}
          </p>
          <footer className="mt-4 flex w-full max-w-[372px] shrink-0 gap-3 self-center">
            <Button
              variant="outline"
              tone="neutral"
              className="h-[41px] flex-1 font-emphasize"
              onClick={handleClose}
            >
              닫기
            </Button>
            <Button
              tone="primary"
              className="h-[41px] flex-1 font-headline"
              disabled={primaryDisabled}
              loading={setDefaultTemplateMutation.isPending}
              onClick={() => void handlePrimaryAction()}
            >
              {primaryLabel}
            </Button>
          </footer>
        </div>
      </Modal>
    </>
  );
};
