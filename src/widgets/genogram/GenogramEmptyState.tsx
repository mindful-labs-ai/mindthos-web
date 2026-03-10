import { trackEvent } from '@/lib/mixpanel';

import { GenogramLoadingAnimationLoop } from './GenogramLoadingAnimation';

interface GenogramEmptyStateProps {
  onStartEmpty: () => void;
  onStartFromRecords?: () => void;
  isGenerating?: boolean;
  hasRecords?: boolean;
}

export function GenogramEmptyState({
  onStartEmpty,
  onStartFromRecords,
  isGenerating = false,
  hasRecords = false,
}: GenogramEmptyStateProps) {
  const canGenerateFromRecords = hasRecords && onStartFromRecords;

  const handleStartEmpty = () => {
    trackEvent('genogram_empty_state_click', { action: 'draw_manually' });
    onStartEmpty();
  };

  const handleStartFromRecords = () => {
    trackEvent('genogram_empty_state_click', {
      action: 'generate_from_records',
    });
    onStartFromRecords?.();
  };

  const genogramButtonStyle =
    'flex h-[326px] w-[327px] flex-col items-center justify-end gap-2.5 rounded-2xl border border-border bg-white px-6 pb-[36px] shadow-sm transition-all hover:border-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="flex h-full items-center justify-center bg-surface">
      <div className="flex gap-6">
        {/* 직접 가계도 그리기 */}
        <button
          onClick={handleStartEmpty}
          disabled={isGenerating}
          className={genogramButtonStyle}
        >
          <div className="flex h-[198px] w-full items-center justify-center">
            <GenogramIllustration />
          </div>
          <h3 className="font-semibold text-fg">직접 가계도 그리기</h3>
        </button>

        {/* 상담기록으로 자동 생성하기 */}
        <button
          onClick={canGenerateFromRecords ? handleStartFromRecords : undefined}
          disabled={!canGenerateFromRecords || isGenerating}
          className={genogramButtonStyle}
        >
          {canGenerateFromRecords && (
            <div className="rounded-md bg-primary px-[15px] py-[7px] text-base font-bold text-surface">
              AI 자동 생성
            </div>
          )}
          <div className="flex h-[198px] w-full items-center justify-center gap-4">
            {isGenerating ? (
              <GenogramLoadingAnimationLoop />
            ) : (
              <AIGenogramIllustration />
            )}
          </div>
          <h3 className="flex gap-0.5 font-semibold text-fg">
            <SparkleIcon />
            상담기록으로 자동 생성하기
          </h3>
          {!canGenerateFromRecords && (
            <div className="rounded-lg bg-surface-strong px-1.5 py-1 text-sm">
              {hasRecords ? '준비 중' : '상담 기록 없음'}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

/** AI 스파클 아이콘 */
function SparkleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_5397_74958)">
        <path
          d="M11.4824 4.75586C11.6094 4.75586 11.6777 4.67773 11.6973 4.56055C11.9902 2.97852 11.9609 2.90039 13.6602 2.59766C13.7773 2.56836 13.8555 2.5 13.8555 2.37305C13.8555 2.25586 13.7773 2.17773 13.6602 2.1582C11.9609 1.85547 11.9902 1.77734 11.6973 0.195312C11.6777 0.078125 11.6094 0 11.4824 0C11.3555 0 11.2871 0.078125 11.2676 0.195312C10.9746 1.77734 11.0039 1.85547 9.30469 2.1582C9.17774 2.17773 9.10938 2.25586 9.10938 2.37305C9.10938 2.5 9.17774 2.56836 9.30469 2.59766C11.0039 2.90039 10.9746 2.97852 11.2676 4.56055C11.2871 4.67773 11.3555 4.75586 11.4824 4.75586Z"
          fill="#44CE4B"
        />
        <path
          d="M6.75977 11.4707C6.94531 11.4707 7.07227 11.3438 7.0918 11.168C7.44336 8.56055 7.53125 8.56055 10.2266 8.04298C10.3926 8.01368 10.5195 7.89649 10.5195 7.71094C10.5195 7.53516 10.3926 7.40821 10.2266 7.38868C7.53125 7.00782 7.43359 6.91993 7.0918 4.27344C7.07227 4.0879 6.94531 3.96094 6.75977 3.96094C6.58398 3.96094 6.45703 4.0879 6.42773 4.28321C6.11523 6.89063 5.96875 6.88087 3.29297 7.38868C3.12695 7.41798 3 7.53516 3 7.71094C3 7.90626 3.12695 8.01368 3.33203 8.04298C5.98828 8.47266 6.11523 8.54102 6.42773 11.1484C6.45703 11.3438 6.58398 11.4707 6.75977 11.4707Z"
          fill="#44CE4B"
        />
        <path
          d="M13.3809 22.2754C13.6348 22.2754 13.8203 22.0898 13.8691 21.8262C14.5625 16.4844 15.3145 15.6641 20.6074 15.0781C20.8809 15.0488 21.0664 14.8535 21.0664 14.5898C21.0664 14.3359 20.8809 14.1406 20.6074 14.1113C15.3145 13.5254 14.5625 12.7051 13.8691 7.35352C13.8203 7.08984 13.6348 6.91406 13.3809 6.91406C13.127 6.91406 12.9414 7.08984 12.9023 7.35352C12.209 12.7051 11.4473 13.5254 6.16406 14.1113C5.88086 14.1406 5.69531 14.3359 5.69531 14.5898C5.69531 14.8535 5.88086 15.0488 6.16406 15.0781C11.4375 15.7715 12.1699 16.4844 12.9023 21.8262C12.9414 22.0898 13.127 22.2754 13.3809 22.2754Z"
          fill="#44CE4B"
        />
      </g>
      <defs>
        <clipPath id="clip0_5397_74958">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** 왼쪽 카드: 가계도 + 마우스 커서 + 녹색 하이라이트 */
function GenogramIllustration() {
  return (
    <svg
      width="149"
      height="150"
      viewBox="0 0 149 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M123.329 122.545L144.408 129.031C145.557 129.385 145.688 130.96 144.612 131.498L135.678 135.965C135.42 136.094 135.211 136.303 135.082 136.561L130.615 145.494C130.077 146.57 128.503 146.44 128.149 145.29L121.662 124.211C121.348 123.188 122.306 122.231 123.329 122.545Z"
        stroke="#3C3C3C"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5312 28.7344V62.128H130.079V28.7344"
        stroke="#3C3C3C"
        strokeWidth="2.5"
      />
      <path
        d="M72.6094 62.5156L72.6094 94.7443"
        stroke="#3C3C3C"
        strokeWidth="2.5"
      />
      <circle
        cx="130.469"
        cy="15.5319"
        r="14.2819"
        fill="white"
        stroke="#3C3C3C"
        strokeWidth="2.5"
      />
      <mask id="path-5-inside-1_2239_12741" fill="white">
        <rect width="31.0638" height="31.0638" rx="0.776596" />
      </mask>
      <rect
        width="31.0638"
        height="31.0638"
        rx="0.776596"
        fill="white"
        stroke="#3C3C3C"
        strokeWidth="5"
        mask="url(#path-5-inside-1_2239_12741)"
      />
      <circle cx="103.5" cy="107.5" r="26.5" fill="#44CE4B" fillOpacity="0.1" />
      <circle
        cx="103.532"
        cy="107.532"
        r="14.2819"
        fill="white"
        stroke="#3C3C3C"
        strokeWidth="2.5"
      />
    </svg>
  );
}

/** 오른쪽 카드: 문서 + 점선 화살표 + 가계도 (녹색 배경) */
function AIGenogramIllustration() {
  return (
    <svg
      width="245"
      height="173"
      viewBox="0 0 245 173"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="69" height="71" rx="16" fill="#44CE4B" fillOpacity="0.1" />
      <path
        d="M32.5 71V107C32.5 109.333 33.9 114 39.5 114C45.1 114 67.5 114 78 114"
        stroke="url(#paint0_linear_2239_12741)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      <rect
        x="78"
        y="26"
        width="167"
        height="147"
        rx="16"
        fill="#44CE4B"
        fillOpacity="0.1"
      />
      <path
        d="M40.6016 17.8594L47.6339 24.8917C48.4122 25.67 48.7991 26.0581 49.0774 26.5122C49.3242 26.9148 49.5067 27.3538 49.6169 27.813C49.7101 28.201 49.7341 28.6077 49.74 29.25C49.742 29.465 49.7422 29.7068 49.7422 29.9828V49.0581C49.7422 51.5734 49.7422 52.8311 49.2522 53.7927C48.8208 54.6395 48.1306 55.3286 47.2838 55.76C46.3222 56.25 45.0644 56.25 42.5491 56.25L25.4353 56.25C22.9199 56.25 21.6604 56.25 20.6987 55.76C19.852 55.3286 19.1641 54.6395 18.7327 53.7927C18.2422 52.8301 18.2422 51.5707 18.2422 49.0504V22.9504C18.2422 20.4302 18.2422 19.1691 18.7327 18.2065C19.1641 17.3598 19.852 16.6719 20.6987 16.2405C21.6613 15.75 22.9224 15.75 25.4426 15.75H35.5103C35.7863 15.75 36.0281 15.75 36.243 15.752C36.8853 15.7578 37.2901 15.7816 37.6781 15.8748C38.1373 15.985 38.5774 16.1668 38.98 16.4136C39.434 16.6918 39.8238 17.0816 40.6016 17.8594Z"
        fill="white"
      />
      <path
        d="M27.2422 47.25H40.7422M27.2422 40.5H40.7422M36.243 15.752C36.0281 15.75 35.7863 15.75 35.5103 15.75H25.4426C22.9224 15.75 21.6613 15.75 20.6987 16.2405C19.852 16.6719 19.1641 17.3598 18.7327 18.2065C18.2422 19.1691 18.2422 20.4302 18.2422 22.9504V49.0504C18.2422 51.5707 18.2422 52.8301 18.7327 53.7927C19.1641 54.6395 19.852 55.3286 20.6987 55.76C21.6604 56.25 22.9199 56.25 25.4353 56.25L42.5491 56.25C45.0644 56.25 46.3222 56.25 47.2838 55.76C48.1306 55.3286 48.8208 54.6395 49.2522 53.7927C49.7422 52.8311 49.7422 51.5734 49.7422 49.0581V29.9828C49.7422 29.7068 49.742 29.465 49.74 29.25M36.243 15.752C36.8853 15.7578 37.2901 15.7816 37.6781 15.8748C38.1373 15.985 38.5774 16.1668 38.98 16.4136C39.434 16.6918 39.8238 17.0816 40.6016 17.8594L47.6339 24.8917C48.4122 25.67 48.7991 26.0581 49.0774 26.5122C49.3242 26.9148 49.5067 27.3538 49.6169 27.813C49.7101 28.201 49.7341 28.6077 49.74 29.25M36.243 15.752L36.2422 22.0505C36.2422 24.5707 36.2422 25.8303 36.7327 26.7929C37.1641 27.6397 37.852 28.3286 38.6987 28.76C39.6604 29.25 40.92 29.25 43.4352 29.25H49.74"
        stroke="#3C3C3C"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M103.531 66.7344V100.128H218.079V66.7344"
        stroke="#3C3C3C"
        strokeWidth="2.5"
      />
      <path
        d="M160.609 100.516L160.609 132.744"
        stroke="#3C3C3C"
        strokeWidth="2.5"
      />
      <circle
        cx="218.469"
        cy="53.5319"
        r="14.2819"
        fill="white"
        stroke="#3C3C3C"
        strokeWidth="2.5"
      />
      <mask id="path-9-inside-1_2239_12741" fill="white">
        <rect x="88" y="38" width="31.0638" height="31.0638" rx="0.776596" />
      </mask>
      <rect
        x="88"
        y="38"
        width="31.0638"
        height="31.0638"
        rx="0.776596"
        fill="white"
        stroke="#3C3C3C"
        strokeWidth="5"
        mask="url(#path-9-inside-1_2239_12741)"
      />
      <circle
        cx="160.61"
        cy="146.727"
        r="14.2819"
        fill="white"
        stroke="#3C3C3C"
        strokeWidth="2.5"
      />
      <defs>
        <linearGradient
          id="paint0_linear_2239_12741"
          x1="25.5"
          y1="71"
          x2="79.5"
          y2="114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#93D696" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
  );
}
