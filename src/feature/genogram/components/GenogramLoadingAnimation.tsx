/**
 * 1단계: 가족 구성원 분석 로딩 애니메이션
 * 돋보기가 문서를 살펴보며 가족 구성원(도형)이 튀어나오는 애니메이션
 */
export function AnalyzeLoadingAnimation() {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="280"
        height="200"
        viewBox="0 0 280 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* 중앙 문서 */}
        <g>
          <rect
            x="75"
            y="15"
            width="130"
            height="170"
            rx="6"
            fill="white"
            stroke="#E0E0E0"
            strokeWidth="2"
          />
          {/* 문서 내 텍스트 라인들 */}
          <line
            x1="95"
            y1="40"
            x2="185"
            y2="40"
            stroke="#E0E0E0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="95"
            y1="55"
            x2="170"
            y2="55"
            stroke="#E0E0E0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* 원을 가로지르는 라인들 */}
          <line
            x1="95"
            y1="85"
            x2="185"
            y2="85"
            stroke="#E0E0E0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="95"
            y1="115"
            x2="185"
            y2="115"
            stroke="#E0E0E0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="95"
            y1="145"
            x2="160"
            y2="145"
            stroke="#E0E0E0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="95"
            y1="160"
            x2="140"
            y2="160"
            stroke="#E0E0E0"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        {/* 돋보기 */}
        <g className="analyze-magnifier">
          {/* 돋보기 렌즈 */}
          <circle
            cx="140"
            cy="100"
            r="35"
            fill="white"
            fillOpacity="0.3"
            stroke="#3C3C3C"
            strokeWidth="3"
          />
          {/* 돋보기 손잡이 */}
          <line
            x1="165"
            y1="125"
            x2="190"
            y2="150"
            stroke="#3C3C3C"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* 왼쪽 상단 - 사각형 (아버지) */}
        <rect
          x="52"
          y="50"
          width="40"
          height="40"
          rx="3"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="analyze-pop-left-top"
        />

        {/* 왼쪽 하단 - 원 (딸) */}
        <circle
          cx="98"
          cy="190"
          r="22"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="analyze-pop-left-bottom"
        />

        {/* 오른쪽 상단 - 사각형 (아들) */}
        <rect
          x="185"
          y="10"
          width="40"
          height="40"
          rx="3"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="analyze-pop-right-top"
        />

        {/* 오른쪽 하단 - 원 (어머니) */}
        <circle
          cx="220"
          cy="130"
          r="22"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="analyze-pop-right-bottom"
        />
      </svg>

      <span className="text-center text-base text-fg-muted">
        정밀 분석 중... <br />
        완성까지 최대 2분 정도 소요될 수 있습니다.
      </span>

      {/* CSS 애니메이션 정의 */}
      <style>{`
        @keyframes magnifierScan {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-15px, -20px) scale(1.05); }
          50% { transform: translate(15px, 0) scale(1); }
          75% { transform: translate(-10px, 20px) scale(1.05); }
        }

        @keyframes popOutLeft {
          0%, 10% {
            opacity: 0;
            transform: translateX(60px) scale(0.3);
          }
          25%, 85% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          95%, 100% {
            opacity: 0;
            transform: translateX(60px) scale(0.3);
          }
        }

        @keyframes popOutRight {
          0%, 10% {
            opacity: 0;
            transform: translateX(-60px) scale(0.3);
          }
          25%, 85% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          95%, 100% {
            opacity: 0;
            transform: translateX(-60px) scale(0.3);
          }
        }

        .analyze-magnifier {
          animation: magnifierScan 4s ease-in-out infinite;
          transform-origin: 140px 100px;
        }

        .analyze-pop-left-top {
          opacity: 0;
          animation: popOutLeft 4s ease-out infinite;
          animation-delay: 0.3s;
          transform-origin: center;
        }

        .analyze-pop-left-bottom {
          opacity: 0;
          animation: popOutLeft 4s ease-out infinite;
          animation-delay: 1.2s;
          transform-origin: center;
        }

        .analyze-pop-right-top {
          opacity: 0;
          animation: popOutRight 4s ease-out infinite;
          animation-delay: 0.7s;
          transform-origin: center;
        }

        .analyze-pop-right-bottom {
          opacity: 0;
          animation: popOutRight 4s ease-out infinite;
          animation-delay: 1.6s;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}

/**
 * 가계도 생성 로딩 애니메이션 (단일 재생)
 * 부모-자녀 핵가족 가계도가 그려지는 애니메이션
 */
export function GenogramLoadingAnimation() {
  // 경로 길이
  const parentLinePath = 220; // 부모 연결선 U자 (30+160+30)
  const childLinePath = 22; // 자녀 수직선 (80→102)

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="200"
        height="160"
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* 아버지 (사각형) */}
        <rect
          x="0"
          y="10"
          width="40"
          height="40"
          rx="2"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          style={{
            opacity: 0,
            animation: 'genogramFadeIn 0.3s ease-out 0s forwards',
          }}
        />

        {/* 어머니 (원) */}
        <circle
          cx="180"
          cy="30"
          r="20"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          style={{
            opacity: 0,
            animation: 'genogramFadeIn 0.3s ease-out 0.3s forwards',
          }}
        />

        {/* 부모 연결선 (U자) */}
        <path
          d="M 20 50 L 20 80 L 180 80 L 180 50"
          stroke="#3C3C3C"
          strokeWidth="2"
          fill="none"
          style={{
            strokeDasharray: parentLinePath,
            strokeDashoffset: parentLinePath,
            animation: `genogramDrawPath 0.6s ease-out 0.6s forwards`,
          }}
        />

        {/* 자녀1 수직선: 부모선(y=80)에서 자녀1(x=50)으로 */}
        <path
          d="M 50 80 L 50 102"
          stroke="#3C3C3C"
          strokeWidth="2"
          fill="none"
          style={{
            strokeDasharray: childLinePath,
            strokeDashoffset: childLinePath,
            animation: `genogramDrawPath 0.3s ease-out 1.2s forwards`,
          }}
        />

        {/* 자녀2 수직선: 부모선(y=80)에서 자녀2(x=100)으로 */}
        <path
          d="M 100 80 L 100 102"
          stroke="#3C3C3C"
          strokeWidth="2"
          fill="none"
          style={{
            strokeDasharray: childLinePath,
            strokeDashoffset: childLinePath,
            animation: `genogramDrawPath 0.3s ease-out 1.4s forwards`,
          }}
        />

        {/* 자녀3 수직선: 부모선(y=80)에서 자녀3(x=150)으로 */}
        <path
          d="M 150 80 L 150 102"
          stroke="#3C3C3C"
          strokeWidth="2"
          fill="none"
          style={{
            strokeDasharray: childLinePath,
            strokeDashoffset: childLinePath,
            animation: `genogramDrawPath 0.3s ease-out 1.6s forwards`,
          }}
        />

        {/* 자녀1 (원 - 딸) */}
        <circle
          cx="50"
          cy="120"
          r="18"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          style={{
            opacity: 0,
            animation: 'genogramFadeIn 0.3s ease-out 1.9s forwards',
          }}
        />

        {/* 자녀2 (사각형 - 아들, IP) */}
        <g
          style={{
            opacity: 0,
            animation: 'genogramFadeIn 0.3s ease-out 1.6s forwards',
          }}
        >
          <rect
            x="82"
            y="102"
            width="36"
            height="36"
            rx="2"
            fill="white"
            stroke="#3C3C3C"
            strokeWidth="2"
          />
          {/* IP 표시 (이중선) */}
          <rect
            x="86"
            y="106"
            width="28"
            height="28"
            rx="1"
            fill="none"
            stroke="#3C3C3C"
            strokeWidth="1.5"
          />
        </g>

        {/* 자녀3 (원 - 딸) */}
        <circle
          cx="150"
          cy="120"
          r="18"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          style={{
            opacity: 0,
            animation: 'genogramFadeIn 0.3s ease-out 2.1s forwards',
          }}
        />

        {/* 완료 체크 효과 */}
        <g
          style={{
            opacity: 0,
            animation: 'genogramCheckAppear 0.8s ease-in-out 2.5s forwards',
          }}
        >
          <circle cx="100" cy="80" r="25" fill="#44CE4B" fillOpacity="0.2" />
          <path
            d="M88 80L96 88L112 72"
            stroke="#44CE4B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 40,
              strokeDashoffset: 40,
              animation: 'genogramDrawPath 0.3s ease-out 2.6s forwards',
            }}
          />
        </g>
      </svg>

      <span className="text-center text-base text-fg-muted">
        가계도를 그리는 중입니다.
      </span>

      {/* CSS 애니메이션 정의 */}
      <style>{`
        @keyframes genogramDrawPath {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes genogramFadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes genogramCheckAppear {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * 무한 반복 버전의 로딩 애니메이션
 * 원본 GenogramLoadingAnimation과 동일한 스타일 (U자 연결선 + 체크)
 */
export function GenogramLoadingAnimationLoop() {
  // 경로 길이
  const parentLinePath = 220; // 부모 연결선 U자 (30+160+30)
  const childLinePath = 22; // 자녀 수직선 (80→102)

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="200"
        height="160"
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* 아버지 (사각형) */}
        <rect
          x="0"
          y="10"
          width="40"
          height="40"
          rx="2"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-loop-father"
        />

        {/* 어머니 (원) */}
        <circle
          cx="180"
          cy="30"
          r="20"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-loop-mother"
        />

        {/* 부모 연결선 (U자) */}
        <path
          d="M 20 50 L 20 80 L 180 80 L 180 50"
          stroke="#3C3C3C"
          strokeWidth="2"
          fill="none"
          className="genogram-loop-parent-line"
          style={{
            // @ts-expect-error CSS custom property
            '--dash-length': parentLinePath,
          }}
        />

        {/* 자녀1 수직선 */}
        <path
          d="M 50 80 L 50 102"
          stroke="#3C3C3C"
          strokeWidth="2"
          fill="none"
          className="genogram-loop-child1-line"
          style={{
            // @ts-expect-error CSS custom property
            '--dash-length': childLinePath,
          }}
        />

        {/* 자녀2 수직선 */}
        <path
          d="M 100 80 L 100 102"
          stroke="#3C3C3C"
          strokeWidth="2"
          fill="none"
          className="genogram-loop-child2-line"
          style={{
            // @ts-expect-error CSS custom property
            '--dash-length': childLinePath,
          }}
        />

        {/* 자녀3 수직선 */}
        <path
          d="M 150 80 L 150 102"
          stroke="#3C3C3C"
          strokeWidth="2"
          fill="none"
          className="genogram-loop-child3-line"
          style={{
            // @ts-expect-error CSS custom property
            '--dash-length': childLinePath,
          }}
        />

        {/* 자녀1 (원 - 딸) */}
        <circle
          cx="50"
          cy="120"
          r="18"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-loop-child1"
        />

        {/* 자녀2 (사각형 - 아들, IP) */}
        <g className="genogram-loop-child2-ip">
          <rect
            x="82"
            y="102"
            width="36"
            height="36"
            rx="2"
            fill="white"
            stroke="#3C3C3C"
            strokeWidth="2"
          />
          {/* IP 표시 (이중선) */}
          <rect
            x="86"
            y="106"
            width="28"
            height="28"
            rx="1"
            fill="none"
            stroke="#3C3C3C"
            strokeWidth="1.5"
          />
        </g>

        {/* 자녀3 (원 - 딸) */}
        <circle
          cx="150"
          cy="120"
          r="18"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-loop-child3"
        />
      </svg>

      <span className="text-center text-base text-fg-muted">
        가계도를 그리는 중입니다.
      </span>

      {/* CSS 애니메이션 정의 - 무한 반복 (4초 사이클) */}
      <style>{`
        @keyframes genogramLoopFadeIn {
          0%, 5% { opacity: 0; transform: scale(0.8); }
          12%, 75% { opacity: 1; transform: scale(1); }
          90%, 100% { opacity: 0; transform: scale(0.8); }
        }

        @keyframes genogramLoopDrawPath {
          0%, 5% { stroke-dashoffset: var(--dash-length); }
          20%, 75% { stroke-dashoffset: 0; }
          90%, 100% { stroke-dashoffset: var(--dash-length); }
        }

        .genogram-loop-father {
          opacity: 0;
          animation: genogramLoopFadeIn 4s ease-in-out infinite;
        }

        .genogram-loop-mother {
          opacity: 0;
          animation: genogramLoopFadeIn 4s ease-in-out infinite;
          animation-delay: 0.15s;
        }

        .genogram-loop-parent-line {
          stroke-dasharray: 220;
          stroke-dashoffset: 220;
          animation: genogramLoopDrawPath 4s ease-in-out infinite;
          animation-delay: 0.3s;
        }

        .genogram-loop-child1-line {
          stroke-dasharray: 22;
          stroke-dashoffset: 22;
          animation: genogramLoopDrawPath 4s ease-in-out infinite;
          animation-delay: 0.6s;
        }

        .genogram-loop-child2-line {
          stroke-dasharray: 22;
          stroke-dashoffset: 22;
          animation: genogramLoopDrawPath 4s ease-in-out infinite;
          animation-delay: 0.7s;
        }

        .genogram-loop-child3-line {
          stroke-dasharray: 22;
          stroke-dashoffset: 22;
          animation: genogramLoopDrawPath 4s ease-in-out infinite;
          animation-delay: 0.8s;
        }

        .genogram-loop-child1 {
          opacity: 0;
          animation: genogramLoopFadeIn 4s ease-in-out infinite;
          animation-delay: 0.9s;
        }

        .genogram-loop-child2-ip {
          opacity: 0;
          animation: genogramLoopFadeIn 4s ease-in-out infinite;
          animation-delay: 0.8s;
        }

        .genogram-loop-child3 {
          opacity: 0;
          animation: genogramLoopFadeIn 4s ease-in-out infinite;
          animation-delay: 1.0s;
        }
      `}</style>
    </div>
  );
}
