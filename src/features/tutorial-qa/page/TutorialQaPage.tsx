import React from 'react';

import { useQuery } from '@tanstack/react-query';

import {
  COHORT_BRANCH,
  type CohortBranch,
} from '@/features/onboarding/constants/cohort';
import {
  getCohortMissionFlow,
  isVideoMission,
  MISSION_TYPE,
  type MissionType,
} from '@/features/onboarding/constants/missionFlow';
import { getTutorialStep } from '@/features/onboarding/constants/tutorialStep';
import {
  TUTORIAL_FAKE_FILE_SIZE_BYTES,
  TUTORIAL_MISSION_COPY,
  VIDEO_MIN_SECONDS,
} from '@/features/onboarding/constants/tutorialUi';
import type { MultiFileInfo } from '@/features/session/types';
import type {
  TutorialVirtualClient,
  TutorialVirtualSession,
} from '@/shared/api/services/tutorial/types';
import { templateService } from '@/shared/api/supabase/templateQueries';
import { templateQueryKeys } from '@/shared/constants/queryKeys';
import { Button, Title } from '@/shared/ui';
import { Modal } from '@/shared/ui/composites/Modal';
import {
  NoteMission,
  TutorialCompletionModal,
  TutorialRewardModal,
  VideoMission,
  type TutorialTemplate,
} from '@/widgets/onboarding/TutorialRebootModal';
import {
  CreateMultiSessionModal,
  type TutorialSessionUploadState,
} from '@/widgets/session/CreateMultiSessionModal';

type QaSurface = 'closed' | 'mission' | 'completion' | 'reward' | 'upload';
type QaVisibleSurface = Exclude<QaSurface, 'closed'>;
type QaStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'EXPIRED' | 'COMPLETED';

const COHORTS = Object.values(COHORT_BRANCH) as CohortBranch[];
const STAGES = [1, 2, 3, 4] as const;

const COHORT_LABEL: Record<CohortBranch, string> = {
  GENOGRAM: '가족·체계 상담',
  CBT: '인지행동 상담',
  PSYCHODYNAMIC: '정신역동 상담',
  HUMANISTIC: '인간중심 상담',
  GENERIC: '마음토스 상담',
};

const MISSION_LABEL: Record<MissionType, string> = {
  [MISSION_TYPE.GUIDE_VIDEO]: '가이드 영상',
  [MISSION_TYPE.EXAMPLE]: '영상 예시',
  [MISSION_TYPE.NOTE]: '상담노트 양식',
  [MISSION_TYPE.CLIENT_AUDIO]: '상담 기록 업로드',
};

const STATUS_LABEL: Record<QaStatus, string> = {
  NOT_STARTED: '시작 전',
  IN_PROGRESS: '진행 중',
  EXPIRED: '만료',
  COMPLETED: '완료',
};

const SURFACE_LABEL: Record<Exclude<QaSurface, 'closed'>, string> = {
  mission: '미션 모달',
  completion: '단계 완료 모달',
  reward: '보상 모달',
  upload: '4단계 업로드 모달',
};

const SAMPLE_TEMPLATES: TutorialTemplate[] = [
  {
    id: -1,
    title: 'QA 기본 상담노트',
    description: '로컬 UI 확인용 기본 상담노트입니다.',
    category: 'CASE_CONCEPTUALIZATION',
  },
  {
    id: -2,
    title: 'QA 제출용 상담노트',
    description: '로컬 UI 확인용 제출 양식입니다.',
    category: 'SUBMISSION',
  },
];

const createDebugSession = (
  clientId: string,
  sessionNumber: number
): TutorialVirtualSession => ({
  id: `tutorial-qa-session-${clientId}-${sessionNumber}`,
  title: `가상 내담자 ${sessionNumber}회기`,
  session_number: sessionNumber,
  processing_status: 'succeeded',
  has_prepared_transcript: true,
  audio_url: null,
});

const createDebugVirtualClient = (
  cohort: CohortBranch
): TutorialVirtualClient => {
  const isGenogram = cohort === COHORT_BRANCH.GENOGRAM;
  const key = isGenogram ? 'LEE_YOUNGSUK' : 'JUNG_SUA';
  const name = isGenogram ? '이영숙' : '정수아';
  const clientId = `tutorial-qa-client-${key.toLowerCase()}`;

  return {
    key,
    client: { id: clientId, name },
    sessions: [1, 2, 3, 4].map((sessionNumber) =>
      createDebugSession(clientId, sessionNumber)
    ),
  };
};

const createDebugFile = (clientName: string): MultiFileInfo => ({
  id: 'tutorial-qa-session-4',
  file: new File(
    [new Uint8Array(TUTORIAL_FAKE_FILE_SIZE_BYTES)],
    `${clientName} 4회기.mp3`,
    { type: 'audio/mpeg' }
  ),
  name: `${clientName} 4회기.mp3`,
  size: TUTORIAL_FAKE_FILE_SIZE_BYTES,
  validationStatus: 'valid',
});

const ControlButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Button
    type="button"
    size="sm"
    variant={active ? 'solid' : 'outline'}
    tone={active ? 'primary' : 'neutral'}
    onClick={onClick}
  >
    {children}
  </Button>
);

const TutorialQaPage = () => {
  const [cohort, setCohort] = React.useState<CohortBranch>(
    COHORT_BRANCH.GENERIC
  );
  const [stage, setStage] = React.useState<number>(1);
  const [surface, setSurface] = React.useState<QaSurface>('mission');
  const [status, setStatus] = React.useState<QaStatus>('IN_PROGRESS');
  const [hasRecord, setHasRecord] = React.useState(false);
  const [videoReady, setVideoReady] = React.useState(false);
  const [noteVideoMode, setNoteVideoMode] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    number | null
  >(null);
  const [directUploadState, setDirectUploadState] = React.useState<
    'idle' | 'loading' | 'ready' | 'processing'
  >('idle');
  const [notice, setNotice] = React.useState<string | null>(null);

  const tutorialStep = getTutorialStep(cohort, stage);
  const mission = getCohortMissionFlow(cohort).find(
    (item) => item.stage === stage
  );
  const isNoteVideo = mission?.type === MISSION_TYPE.NOTE && noteVideoMode;
  const missionCopy =
    tutorialStep && noteVideoMode
      ? (TUTORIAL_MISSION_COPY[tutorialStep].afterAction ??
        TUTORIAL_MISSION_COPY[tutorialStep])
      : tutorialStep
        ? TUTORIAL_MISSION_COPY[tutorialStep]
        : null;
  const virtualClient = React.useMemo(
    () => createDebugVirtualClient(cohort),
    [cohort]
  );

  const templatesQuery = useQuery({
    queryKey: [...templateQueryKeys.list(), 'tutorial-qa'],
    queryFn: async () => {
      const response = await templateService.getTemplates();
      return response.templates as TutorialTemplate[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const templates =
    templatesQuery.data && templatesQuery.data.length > 0
      ? templatesQuery.data
      : SAMPLE_TEMPLATES;

  React.useEffect(() => {
    setVideoReady(false);
    setNoteVideoMode(false);
    setDirectUploadState('idle');
    setSelectedTemplateId(null);
    setSurface(
      mission?.type === MISSION_TYPE.CLIENT_AUDIO ? 'upload' : 'mission'
    );
    setNotice(null);
  }, [cohort, mission?.type, stage]);

  const setStageFromButton = (nextStage: number) => {
    setStage(nextStage);
    if (nextStage === 4) setStatus('IN_PROGRESS');
  };

  const openCompletion = () => {
    setSurface('completion');
    setStatus(stage === 4 ? 'COMPLETED' : 'IN_PROGRESS');
  };

  const handlePrimaryAction = () => {
    if (!mission || !tutorialStep) return;

    if (isNoteVideo) {
      if (!videoReady) return;
      openCompletion();
      return;
    }

    if (mission.type === MISSION_TYPE.NOTE) {
      setNoteVideoMode(true);
      setVideoReady(false);
      return;
    }

    openCompletion();
  };

  const handleDirectUpload = React.useCallback(() => {
    setDirectUploadState('ready');
    setNotice(
      'QA용 4회기 준비 파일을 표시했습니다. 다음 버튼을 누르면 업로드 처리가 시작됩니다.'
    );
  }, []);

  const handleUploadComplete = React.useCallback(() => {
    setDirectUploadState('ready');
    setSurface('completion');
    setStatus('COMPLETED');
  }, []);

  const tutorialFiles = React.useMemo(
    () =>
      directUploadState === 'ready' || directUploadState === 'processing'
        ? [createDebugFile(virtualClient.client.name)]
        : [],
    [directUploadState, virtualClient.client.name]
  );

  const uploadTutorial = React.useMemo<TutorialSessionUploadState>(
    () => ({
      files: tutorialFiles,
      clientName: virtualClient.client.name,
      clientId: undefined,
      isRecordUnavailable: !hasRecord,
      directUploadState,
      onDirectUpload: handleDirectUpload,
      onRemoveUploadedFile: () => setDirectUploadState('idle'),
      onComplete: handleUploadComplete,
      debug: true,
    }),
    [
      directUploadState,
      handleDirectUpload,
      handleUploadComplete,
      hasRecord,
      tutorialFiles,
      virtualClient.client.name,
    ]
  );

  const primaryDisabled =
    (mission &&
      (isVideoMission(mission.type) ||
        mission.type === MISSION_TYPE.CLIENT_AUDIO)) ||
    isNoteVideo
      ? !videoReady
      : mission?.type === MISSION_TYPE.NOTE && !noteVideoMode
        ? selectedTemplateId === null
        : false;

  const renderMission = () => {
    if (!mission || !tutorialStep) return null;

    if (
      isVideoMission(mission.type) ||
      mission.type === MISSION_TYPE.CLIENT_AUDIO ||
      isNoteVideo
    ) {
      return (
        <VideoMission
          content={missionCopy?.content ?? ''}
          canContinue={videoReady}
          onTimeUpdate={(currentTime) => {
            if (currentTime >= VIDEO_MIN_SECONDS) setVideoReady(true);
          }}
        />
      );
    }

    return (
      <NoteMission
        content={missionCopy?.content ?? ''}
        cohort={cohort}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        isLoading={templatesQuery.isLoading}
        onSelect={setSelectedTemplateId}
      />
    );
  };

  return (
    <main className="min-h-screen bg-grey-10 px-4 py-8 text-fg md:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        <header>
          <p className="mb-1 text-sm font-medium text-primary">
            LOCAL TUTORIAL QA
          </p>
          <Title as="h1" className="text-left text-2xl font-headline">
            튜토리얼 UI 디버그 도구
          </Title>
          <p className="mt-2 max-w-3xl text-sm text-fg-muted">
            코호트·단계·Q3 응답·모달 상태를 바꿔가며 실제 튜토리얼 UI를
            확인합니다. 이 화면의 완료·업로드 동작은 서버 상태와 세션 데이터를
            변경하지 않습니다.
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm lg:grid-cols-[280px_1fr]">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-fg-muted">코호트</p>
              <select
                aria-label="QA 코호트"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                value={cohort}
                onChange={(event) =>
                  setCohort(event.target.value as CohortBranch)
                }
              >
                {COHORTS.map((item) => (
                  <option key={item} value={item}>
                    {item} · {COHORT_LABEL[item]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-fg-muted">단계</p>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((item) => (
                  <ControlButton
                    key={item}
                    active={stage === item}
                    onClick={() => setStageFromButton(item)}
                  >
                    {item}단계
                  </ControlButton>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-fg-muted">
                확인할 UI 상태
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SURFACE_LABEL) as QaVisibleSurface[]).map(
                  (item) => (
                    <ControlButton
                      key={item}
                      active={surface === item}
                      onClick={() =>
                        setSurface(
                          item === 'mission' &&
                            mission?.type === MISSION_TYPE.CLIENT_AUDIO
                            ? 'upload'
                            : item
                        )
                      }
                    >
                      {SURFACE_LABEL[item]}
                    </ControlButton>
                  )
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-fg-muted">
                튜토리얼 상태 계약
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_LABEL) as QaStatus[]).map((item) => (
                  <ControlButton
                    key={item}
                    active={status === item}
                    onClick={() => setStatus(item)}
                  >
                    {STATUS_LABEL[item]}
                  </ControlButton>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-fg-muted">
                Q3 상담 기록
              </p>
              <div className="flex flex-wrap gap-2">
                <ControlButton
                  active={hasRecord}
                  onClick={() => {
                    setHasRecord(true);
                    setDirectUploadState('idle');
                  }}
                >
                  있음
                </ControlButton>
                <ControlButton
                  active={!hasRecord}
                  onClick={() => {
                    setHasRecord(false);
                    setDirectUploadState('idle');
                  }}
                >
                  없음
                </ControlButton>
              </div>
            </div>

            {mission && isVideoMission(mission.type) && (
              <div>
                <p className="mb-2 text-sm font-medium text-fg-muted">
                  영상 30초 도달 상태
                </p>
                <ControlButton
                  active={videoReady}
                  onClick={() => setVideoReady((ready) => !ready)}
                >
                  {videoReady ? '활성화됨' : '비활성화됨'}
                </ControlButton>
              </div>
            )}
          </div>

          <div className="min-w-0 rounded-xl border border-border bg-grey-10 p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-primary">현재 선택</p>
                <h2 className="mt-1 text-lg font-headline">
                  {cohort} · TutorialStep {tutorialStep}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-fg-muted">
                <span className="rounded-full bg-white px-3 py-1">
                  미션: {MISSION_LABEL[mission?.type ?? MISSION_TYPE.EXAMPLE]}
                </span>
                <span className="rounded-full bg-white px-3 py-1">
                  variant: {mission?.variant ?? '-'}
                </span>
                <span className="rounded-full bg-white px-3 py-1">
                  내담자: {virtualClient.client.name}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="bg-grey-10 text-fg-muted">
                  <tr>
                    <th className="px-3 py-2">코호트</th>
                    <th className="px-3 py-2">단계</th>
                    <th className="px-3 py-2">TutorialStep</th>
                    <th className="px-3 py-2">UI renderer</th>
                    <th className="px-3 py-2">variant</th>
                  </tr>
                </thead>
                <tbody>
                  {COHORTS.flatMap((item) =>
                    STAGES.map((itemStage) => {
                      const itemStep = getTutorialStep(item, itemStage);
                      const itemMission = getCohortMissionFlow(item).find(
                        (config) => config.stage === itemStage
                      );
                      const selected = item === cohort && itemStage === stage;
                      return (
                        <tr
                          key={itemStep}
                          className={
                            selected
                              ? 'bg-primary-subtle'
                              : 'border-t border-grey-20'
                          }
                        >
                          <td className="px-3 py-2">{item}</td>
                          <td className="px-3 py-2">{itemStage}</td>
                          <td className="px-3 py-2 font-medium">{itemStep}</td>
                          <td className="px-3 py-2">
                            {itemMission
                              ? MISSION_LABEL[itemMission.type]
                              : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {itemMission?.variant ?? '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {notice && (
              <p className="mt-4 rounded-lg border border-primary bg-primary-subtle px-3 py-2 text-sm text-primary">
                {notice}
              </p>
            )}
          </div>
        </section>
      </div>

      {surface === 'mission' && mission && tutorialStep && (
        <Modal
          open
          onOpenChange={(open) => !open && setSurface('closed')}
          scrollableBody={false}
          className="h-[min(848px,90vh)] max-h-[90vh] w-[872px] max-w-[calc(100vw-2rem)] border-none p-0"
        >
          <div className="flex min-h-0 flex-1 flex-col px-5 py-7 sm:px-10 sm:py-8 md:px-14">
            <header className="shrink-0 text-center">
              <h2 className="typo-xl font-headline text-fg">
                튜토리얼 {stage}단계. 가이드
              </h2>
              <p className="typo-m mt-5 font-headline text-primary">
                {missionCopy?.subtitle ?? ''}
              </p>
            </header>
            <div className="mt-7 min-h-0 flex-1 overflow-y-auto">
              {renderMission()}
            </div>
            <p className="typo-sm mt-6 min-h-5 shrink-0 text-center text-danger" />
            <footer className="mt-4 flex w-full max-w-[372px] shrink-0 gap-3 self-center">
              <Button
                variant="outline"
                tone="neutral"
                className="h-[41px] flex-1 font-emphasize"
                onClick={() => setSurface('closed')}
              >
                닫기
              </Button>
              <Button
                tone="primary"
                className="h-[41px] flex-1 font-headline"
                disabled={primaryDisabled}
                onClick={handlePrimaryAction}
              >
                {missionCopy?.buttonText ?? ''}
              </Button>
            </footer>
          </div>
        </Modal>
      )}

      {surface === 'completion' && tutorialStep && (
        <TutorialCompletionModal
          step={tutorialStep}
          onClose={() => setSurface('closed')}
          onNext={() => {
            if (stage === 4) {
              setSurface('reward');
              return;
            }

            setStageFromButton(stage + 1);
            setSurface('mission');
          }}
        />
      )}

      {surface === 'reward' && (
        <TutorialRewardModal
          onClose={() => setSurface('closed')}
          onClaim={() => {
            setNotice('QA 미리보기: 실제 보상 API는 호출하지 않았습니다.');
            setSurface('closed');
          }}
          isLoading={false}
        />
      )}

      {surface === 'upload' && (
        <CreateMultiSessionModal
          open
          onOpenChange={(open) => !open && setSurface('closed')}
          tutorial={uploadTutorial}
        />
      )}
    </main>
  );
};

export default TutorialQaPage;
