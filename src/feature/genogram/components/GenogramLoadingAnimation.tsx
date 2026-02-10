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
        상담기록을 기반으로 내담자의 <br />
        가족 구성원을 분석합니다.
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
 * 전체 애니메이션이 끝나면 다시 시작
 */
export function GenogramLoadingAnimationLoop() {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="200"
        height="160"
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        style={{ animation: 'resetAnimation 4s linear infinite' }}
      >
        {/* 부모 연결선 (가로) */}
        <line
          x1="60"
          y1="30"
          x2="140"
          y2="30"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-line-h"
        />

        {/* 부모-자녀 연결선 (세로) */}
        <line
          x1="100"
          y1="30"
          x2="100"
          y2="70"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-line-v1"
        />

        {/* 자녀 연결선 (가로) */}
        <line
          x1="50"
          y1="70"
          x2="150"
          y2="70"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-line-children"
        />

        {/* 자녀1 연결선 */}
        <line
          x1="50"
          y1="70"
          x2="50"
          y2="100"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-line-child1"
        />

        {/* 자녀2 연결선 */}
        <line
          x1="100"
          y1="70"
          x2="100"
          y2="100"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-line-child2"
        />

        {/* 자녀3 연결선 */}
        <line
          x1="150"
          y1="70"
          x2="150"
          y2="100"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-line-child3"
        />

        {/* 아버지 (사각형) */}
        <rect
          x="40"
          y="10"
          width="40"
          height="40"
          rx="2"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-father"
        />

        {/* 어머니 (원) */}
        <circle
          cx="140"
          cy="30"
          r="20"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-mother"
        />

        {/* 자녀1 (원 - 딸) */}
        <circle
          cx="50"
          cy="120"
          r="18"
          fill="white"
          stroke="#3C3C3C"
          strokeWidth="2"
          className="genogram-child1"
        />

        {/* 자녀2 (사각형 - 아들, IP) */}
        <g className="genogram-child2-ip">
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
          className="genogram-child3"
        />
      </svg>

      <span className="text-center text-base text-fg-muted">
        가계도를 그리는 중입니다.
      </span>

      {/* CSS 애니메이션 정의 - 무한 반복 */}
      <style>{`
        @keyframes resetAnimation {
          0%, 100% { opacity: 1; }
        }

        @keyframes drawLineLoop {
          0%, 100% { stroke-dashoffset: var(--dash-length); }
          25%, 90% { stroke-dashoffset: 0; }
          95% { stroke-dashoffset: 0; opacity: 1; }
          98% { opacity: 0; }
        }

        @keyframes fadeInLoop {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          20%, 85% { opacity: 1; transform: scale(1); }
          95% { opacity: 0; transform: scale(0.8); }
        }

        .genogram-father {
          opacity: 0;
          animation: fadeInLoop 4s ease-in-out infinite;
          animation-delay: 0s;
        }

        .genogram-mother {
          opacity: 0;
          animation: fadeInLoop 4s ease-in-out infinite;
          animation-delay: 0.2s;
        }

        .genogram-line-h {
          --dash-length: 80;
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          animation: drawLineLoop 4s ease-in-out infinite;
          animation-delay: 0.4s;
        }

        .genogram-line-v1 {
          --dash-length: 40;
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: drawLineLoop 4s ease-in-out infinite;
          animation-delay: 0.7s;
        }

        .genogram-line-children {
          --dash-length: 100;
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawLineLoop 4s ease-in-out infinite;
          animation-delay: 0.9s;
        }

        .genogram-line-child1 {
          --dash-length: 30;
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: drawLineLoop 4s ease-in-out infinite;
          animation-delay: 1.2s;
        }

        .genogram-line-child2 {
          --dash-length: 30;
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: drawLineLoop 4s ease-in-out infinite;
          animation-delay: 1.3s;
        }

        .genogram-line-child3 {
          --dash-length: 30;
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: drawLineLoop 4s ease-in-out infinite;
          animation-delay: 1.4s;
        }

        .genogram-child1 {
          opacity: 0;
          animation: fadeInLoop 4s ease-in-out infinite;
          animation-delay: 1.5s;
        }

        .genogram-child2-ip {
          opacity: 0;
          animation: fadeInLoop 4s ease-in-out infinite;
          animation-delay: 1.7s;
        }

        .genogram-child3 {
          opacity: 0;
          animation: fadeInLoop 4s ease-in-out infinite;
          animation-delay: 1.9s;
        }
      `}</style>
    </div>
  );
}
