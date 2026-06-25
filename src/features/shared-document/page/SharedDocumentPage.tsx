import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useParams } from 'react-router-dom';

import { ServerApiError } from '@/shared/api/server/serverClient';

import { parseFields } from '../../document/constants/formField';
import type { DocumentResponse, FieldAnswer } from '../../document/types';
import {
  fetchSharedDocument,
  submitSharedDocument,
  type SharedDocument,
  type SharedDocumentParams,
} from '../api/sharedDocumentApi';
import { SharedConsentDetail } from '../components/SharedConsentDetail';
import { SharedConsentRead } from '../components/SharedConsentRead';
import { SharedDocumentComplete } from '../components/SharedDocumentComplete';
import { SharedDocumentIntro } from '../components/SharedDocumentIntro';
import { SharedQnaFunnel } from '../components/SharedQnaFunnel';
import { SharedSignatureSheet } from '../components/SharedSignatureSheet';

/** intro(안내+민감정보 동의) → detail(상세) → read(동의서 열람·서명) / funnel(질문응답). */
type Step = 'intro' | 'detail' | 'read' | 'funnel';

/** 로드 실패 상태 → 내담자 안내 문구(서버 가드 403/404/409). */
function loadErrorMessage(status?: number): string {
  if (status === 403)
    return '유효하지 않은 링크예요. 링크를 다시 확인해 주세요.';
  if (status === 404) return '문서를 찾을 수 없어요.';
  if (status === 409) return '만료되었거나 취소된 문서예요.';
  return '문서를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
}

/** 중앙 안내(로딩/에러/완료 공용). */
function CenterNotice({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-grey-20 px-6">
      <div className="w-full max-w-[480px] rounded-2xl border border-grey-40 bg-white px-8 py-12 text-center">
        <p className="text-l font-emphasize text-grey-100">{title}</p>
        {description && (
          <p className="mt-3 text-m font-medium leading-[150%] text-grey-70">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 데스크탑 프레임 — 모바일은 풀스크린, 데스크탑(lg)은 폰 폭(460px) 카드로 가운데 정렬하고
 * 양옆은 배경(#E9EAF0)으로 채운다. 각 화면(min-h-dvh/h-dvh)을 그대로 감싼다.
 */
function SharedScreenFrame({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex lg:min-h-dvh lg:justify-center lg:bg-[#E9EAF0]">
      <div className="w-full lg:max-w-[460px] lg:shadow-[0_0_40px_rgba(0,0,0,0.08)]">
        {children}
      </div>
    </div>
  );
}

/**
 * 내담자 공유 문서 페이지(@Public, 모바일 우선). 알림톡 링크로 진입해 문서를 열람/서명/응답한다.
 * 인증 없이(serverRequestPublic) URL 토큰으로만 접근.
 *   동의서: intro → (민감정보 상세) → 문서 열람 → 서명(바텀시트) → 제출
 *   질문응답: intro → (민감정보 상세) → 문항 퍼널(한 문항 = 한 페이지) → 제출
 */
export default function SharedDocumentPage() {
  const { clientId, sentRowId, accessToken } = useParams();
  const params: SharedDocumentParams | null = useMemo(
    () =>
      clientId && sentRowId && accessToken
        ? { clientId, sentRowId, accessToken }
        : null,
    [clientId, sentRowId, accessToken]
  );

  const [doc, setDoc] = useState<SharedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('intro');
  // 인트로 [필수] 민감정보 동의 — 모든 공유문서 공통 시스템 동의(문서 content 필드와 무관).
  // 제출 시 sensitiveInfoConsent로 서버에 전송 → 서버가 true 강제 +
  // sent_document.sensitive_info_consent_at에 동의 시각 기록(응답 jsonb와 분리된 전용 컬럼).
  const [sensitiveConsent, setSensitiveConsent] = useState(false);

  // 필드 key → 응답(FieldAnswer) — CONSENT/QNA 공통 단일 응답맵
  const [answers, setAnswers] = useState<Record<string, FieldAnswer>>({});
  // 서명 시트 — 열려 있는 동안 대상 필드 key를 기억(QNA signature 필드). CONSENT는 null.
  const [signOpen, setSignOpen] = useState(false);
  const [signTargetKey, setSignTargetKey] = useState<string | null>(null);
  // 동의서(CONSENT) 모드 서명 dataURL — read 화면 푸터/제출에 사용
  const [signature, setSignature] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!params) {
      setLoadError('유효하지 않은 링크예요.');
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchSharedDocument(params)
      .then((d) => {
        if (active) setDoc(d);
      })
      .catch((e: unknown) => {
        if (active) {
          setLoadError(
            loadErrorMessage(e instanceof ServerApiError ? e.status : undefined)
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, sentRowId, accessToken]);

  const updateAnswer = (fieldKey: string, answer: FieldAnswer) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: answer }));
  };

  const submit = async (response: DocumentResponse) => {
    if (!params) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // sensitiveConsent: 인트로 [필수] 민감정보 동의 — 서버가 true 요구·동의 시각 기록(전용 컬럼).
      const updated = await submitSharedDocument(
        params,
        response,
        sensitiveConsent
      );
      setDoc(updated);
      setDone(true);
    } catch (e) {
      setSubmitError(
        e instanceof ServerApiError
          ? e.message
          : '제출에 실패했어요. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <SharedScreenFrame>
        <CenterNotice title="문서를 불러오는 중이에요..." />
      </SharedScreenFrame>
    );
  if (loadError)
    return (
      <SharedScreenFrame>
        <CenterNotice title={loadError} />
      </SharedScreenFrame>
    );
  if (!doc)
    return (
      <SharedScreenFrame>
        <CenterNotice title="문서를 찾을 수 없어요." />
      </SharedScreenFrame>
    );
  if (doc.completedAt || done) {
    return (
      <SharedScreenFrame>
        <SharedDocumentComplete doc={doc} />
      </SharedScreenFrame>
    );
  }

  // 통합 본문 필드 — CONSENT/QNA 공통 봉투에서 파싱.
  const fields = parseFields(doc.content);

  /** 동의서(CONSENT) 제출 — consent 필드는 동의, signature 필드는 서명으로 채워 응답맵 구성. */
  const submitConsent = () => {
    const signedAt = new Date().toISOString();
    const built: Record<string, FieldAnswer> = { ...answers };
    for (const field of fields) {
      if (field.type === 'consent') {
        built[field.key] = { agreed: true };
      } else if (field.type === 'signature') {
        built[field.key] = {
          signatureDataUrl: signature ?? '',
          signedName: doc.clientName,
          signedAt,
        };
      }
    }
    return submit({ answers: built });
  };

  const submitQna = () => submit({ answers });

  let content: ReactElement;
  if (step === 'detail') {
    content = (
      <SharedConsentDetail
        onConfirm={() => {
          setSensitiveConsent(true);
          setStep('intro');
        }}
        onBack={() => setStep('intro')}
      />
    );
  } else if (step === 'read') {
    content = (
      <SharedConsentRead
        doc={doc}
        fields={fields}
        signatureDataUrl={signature}
        submitting={submitting}
        onBack={() => setStep('intro')}
        onSign={() => {
          setSignTargetKey(null);
          setSignOpen(true);
        }}
        onSubmit={submitConsent}
      />
    );
  } else if (step === 'funnel') {
    content = (
      <SharedQnaFunnel
        doc={doc}
        answers={answers}
        onAnswerChange={updateAnswer}
        onRequestSignature={(fieldKey) => {
          setSignTargetKey(fieldKey);
          setSignOpen(true);
        }}
        submitting={submitting}
        onBack={() => setStep('intro')}
        onSubmit={submitQna}
      />
    );
  } else {
    content = (
      <SharedDocumentIntro
        doc={doc}
        consent={sensitiveConsent}
        onConsentChange={setSensitiveConsent}
        onOpenDetail={() => setStep('detail')}
        onNext={() => setStep(doc.kind === 'CONSENT' ? 'read' : 'funnel')}
        onBack={() => window.history.back()}
      />
    );
  }

  return (
    <SharedScreenFrame>
      {content}
      {/* 서명 시트(공용) — CONSENT는 서명 상태, QNA signature 필드는 해당 필드 응답으로 반영. */}
      <SharedSignatureSheet
        open={signOpen}
        onClose={() => setSignOpen(false)}
        onConfirm={(dataUrl) => {
          if (signTargetKey) {
            updateAnswer(signTargetKey, {
              signatureDataUrl: dataUrl,
              signedName: doc.clientName,
              signedAt: new Date().toISOString(),
            });
          } else {
            setSignature(dataUrl);
          }
          setSignOpen(false);
        }}
      />
      {submitError && (
        <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
          <div className="mx-auto max-w-[480px] rounded-lg bg-red-80 px-4 py-3 text-sm font-medium text-white shadow-lg">
            {submitError}
          </div>
        </div>
      )}
    </SharedScreenFrame>
  );
}
