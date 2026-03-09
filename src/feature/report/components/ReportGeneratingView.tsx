/**
 * 보고서 생성 대기 화면
 *
 * 세 가지 상태를 렌더링:
 * - processing: 종이 위에 가계도가 그려지는 SVG 애니메이션
 * - success: 녹색 체크 + 자동 이동 안내
 * - error: 에러 메시지 + 문의 버튼
 */
import { Check } from 'lucide-react';

import './report-generating.css';

// ============================================
// 메인 컴포넌트
// ============================================

type GeneratingStatus = 'processing' | 'success' | 'error';

interface ReportGeneratingViewProps {
  status: GeneratingStatus;
  onSuccessProceed?: () => void;
}

export function ReportGeneratingView({
  status,
  onSuccessProceed,
}: ReportGeneratingViewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-4">
      {status === 'processing' && <ProcessingAnimation />}
      {status === 'success' && <SuccessState onProceed={onSuccessProceed} />}
      {status === 'error' && <ErrorState />}
    </div>
  );
}

export type { GeneratingStatus };

// ============================================
// 로딩 애니메이션 (processing)
// ============================================

/** 종이 위에 가계도가 그려지는 애니메이션 (무한 반복) */
function ProcessingAnimation() {
  return (
    <div className="flex flex-col items-center gap-6">
      <svg
        width="220"
        height="260"
        viewBox="0 0 220 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* ── 종이 그림자 ── */}
        <rect
          x="28"
          y="12"
          width="164"
          height="216"
          rx="5"
          fill="#E8E8E8"
          className="rpt-paper"
        />

        {/* ── 종이 본체 ── */}
        <rect
          x="24"
          y="8"
          width="164"
          height="216"
          rx="5"
          fill="white"
          stroke="#D4D4D4"
          strokeWidth="1.5"
          className="rpt-paper"
        />

        {/* ── 접힌 모서리 ── */}
        <path
          d="M168 8 L188 8 L188 28 Z"
          fill="#F0F0F0"
          stroke="#D4D4D4"
          strokeWidth="1"
          className="rpt-paper"
        />

        {/* ── 제목 텍스트 라인 ── */}
        <line
          x1="48"
          y1="34"
          x2="148"
          y2="34"
          stroke="#E0E0E0"
          strokeWidth="5"
          strokeLinecap="round"
          className="rpt-line-1"
        />
        <line
          x1="48"
          y1="46"
          x2="120"
          y2="46"
          stroke="#E0E0E0"
          strokeWidth="3"
          strokeLinecap="round"
          className="rpt-line-2"
        />

        {/* ── 구분선 ── */}
        <line
          x1="48"
          y1="56"
          x2="164"
          y2="56"
          stroke="#F0F0F0"
          strokeWidth="1"
          className="rpt-line-2"
        />

        {/* ── 가계도 심볼들 ── */}

        {/* 아버지 (사각형) */}
        <rect
          x="64"
          y="68"
          width="20"
          height="20"
          rx="2"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="1.5"
          className="rpt-father"
        />

        {/* 어머니 (원) */}
        <circle
          cx="138"
          cy="78"
          r="10"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="1.5"
          className="rpt-mother"
        />

        {/* 부모 연결선 */}
        <path
          d="M84 78 L128 78"
          stroke="#3C3C3C"
          strokeWidth="1.5"
          fill="none"
          className="rpt-parent-line"
          style={{ '--dash-len': 44 } as React.CSSProperties}
        />

        {/* 자녀 줄기 (중앙 → 아래) */}
        <path
          d="M106 78 L106 96"
          stroke="#3C3C3C"
          strokeWidth="1.5"
          fill="none"
          className="rpt-child-stem"
          style={{ '--dash-len': 18 } as React.CSSProperties}
        />

        {/* 자녀 가로선 */}
        <path
          d="M82 96 L130 96"
          stroke="#3C3C3C"
          strokeWidth="1.5"
          fill="none"
          className="rpt-child-horiz"
          style={{ '--dash-len': 48 } as React.CSSProperties}
        />

        {/* 자녀1 줄기 */}
        <path
          d="M82 96 L82 108"
          stroke="#3C3C3C"
          strokeWidth="1.5"
          fill="none"
          className="rpt-c1-line"
          style={{ '--dash-len': 12 } as React.CSSProperties}
        />

        {/* 자녀2 줄기 */}
        <path
          d="M130 96 L130 108"
          stroke="#3C3C3C"
          strokeWidth="1.5"
          fill="none"
          className="rpt-c2-line"
          style={{ '--dash-len': 12 } as React.CSSProperties}
        />

        {/* 자녀1 (원 - 딸) */}
        <circle
          cx="82"
          cy="116"
          r="8"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="1.5"
          className="rpt-child1"
        />

        {/* 자녀2 (사각형 - 아들) */}
        <rect
          x="123"
          y="109"
          width="14"
          height="14"
          rx="1"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="1.5"
          className="rpt-child2"
        />

        {/* ── 하단 본문 텍스트 라인들 ── */}
        <line
          x1="48"
          y1="140"
          x2="164"
          y2="140"
          stroke="#E0E0E0"
          strokeWidth="3"
          strokeLinecap="round"
          className="rpt-body-1"
        />
        <line
          x1="48"
          y1="152"
          x2="155"
          y2="152"
          stroke="#E0E0E0"
          strokeWidth="3"
          strokeLinecap="round"
          className="rpt-body-2"
        />
        <line
          x1="48"
          y1="164"
          x2="160"
          y2="164"
          stroke="#E0E0E0"
          strokeWidth="3"
          strokeLinecap="round"
          className="rpt-body-3"
        />
        <line
          x1="48"
          y1="176"
          x2="130"
          y2="176"
          stroke="#E0E0E0"
          strokeWidth="3"
          strokeLinecap="round"
          className="rpt-body-4"
        />
        <line
          x1="48"
          y1="194"
          x2="164"
          y2="194"
          stroke="#E0E0E0"
          strokeWidth="3"
          strokeLinecap="round"
          className="rpt-body-5"
        />
        <line
          x1="48"
          y1="206"
          x2="140"
          y2="206"
          stroke="#E0E0E0"
          strokeWidth="3"
          strokeLinecap="round"
          className="rpt-body-6"
        />

        {/* ── Shimmer 효과 ── */}
        <defs>
          <clipPath id="rptPaperClip">
            <rect x="24" y="8" width="164" height="216" rx="5" />
          </clipPath>
          <linearGradient id="rptShimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" stopOpacity="0.35" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x="-60"
          y="8"
          width="80"
          height="216"
          fill="url(#rptShimmer)"
          clipPath="url(#rptPaperClip)"
          className="rpt-shimmer"
        />

        {/* ── 로딩 dots ── */}
        <circle cx="96" cy="244" r="3.5" fill="#D4D4D4" className="rpt-dot-1" />
        <circle
          cx="110"
          cy="244"
          r="3.5"
          fill="#D4D4D4"
          className="rpt-dot-2"
        />
        <circle
          cx="124"
          cy="244"
          r="3.5"
          fill="#D4D4D4"
          className="rpt-dot-3"
        />
      </svg>

      <span className="text-center text-base text-fg-muted">
        보고서를 생성하고 있습니다...
      </span>
      <span className="text-center text-xs text-primary">
        최대 1분 정도 소요될 수 있습니다.
      </span>
    </div>
  );
}

// ============================================
// 성공 상태
// ============================================

function SuccessState({ onProceed }: { onProceed?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="rpt-success-pop flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-fg">
        보고서가 생성되었습니다!
      </h3>
      <p className="text-sm text-fg-muted">
        미리보기로 이동하여 보고서를 확인해보세요.
      </p>
      {onProceed && (
        <button
          type="button"
          onClick={onProceed}
          className="mt-2 w-full max-w-[240px] rounded-xl bg-primary py-3 text-base font-semibold text-white transition-colors hover:bg-primary-400"
        >
          보고서 확인하기
        </button>
      )}
    </div>
  );
}

// ============================================
// 실패 상태
// ============================================

const KAKAO_INQUIRY_URL = 'https://open.kakao.com/o/sM96U0oh';

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h3 className="text-lg font-semibold text-fg">
        아쉽게도 보고서를 생성할 수 없어요.
      </h3>
      <p className="text-center text-sm leading-relaxed text-fg-muted">
        축어록 내용이 충분하지 않거나, 보고서 생성에
        <br />
        적합하지 않은 경우 보고서를 생성할 수 없습니다.
        <br />
        혹은 알 수 없는 문제가 발생했을 수도 있어요.
      </p>
      <p className="text-center text-sm text-fg-muted">
        자세한 내용은 아래로 문의해주세요.
      </p>
      <a
        href={KAKAO_INQUIRY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 rounded-xl border border-border px-6 py-3 text-base font-semibold text-fg transition-colors hover:bg-surface-contrast"
      >
        마음토스 오류 문의
      </a>
    </div>
  );
}
