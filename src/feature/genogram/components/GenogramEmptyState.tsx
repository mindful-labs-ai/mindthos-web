interface GenogramEmptyStateProps {
  onStartEmpty: () => void;
}

export function GenogramEmptyState({ onStartEmpty }: GenogramEmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center bg-surface">
      <div className="flex gap-6">
        {/* 빈 화면으로 시작하기 */}
        <button
          onClick={onStartEmpty}
          className="flex w-[280px] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex h-[160px] w-full items-center justify-center">
            <GenogramIllustration />
          </div>
          <h3 className="font-semibold text-fg">빈 화면으로 시작하기</h3>
        </button>

        {/* 상담기록으로 자동 생성하기 (TODO) */}
        <div className="flex w-[280px] cursor-not-allowed flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-white p-6 opacity-50 shadow-sm">
          <div className="flex h-[160px] w-full items-center justify-center">
            <AIGenogramIllustration />
          </div>
          <h3 className="font-semibold text-fg">상담기록으로 자동 생성하기</h3>
          <div className="rounded-lg bg-surface-strong px-1.5 py-1">
            준비 중
          </div>
        </div>
      </div>
    </div>
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
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M15.5312 28.7344V62.128H130.079V28.7344"
        stroke="#3C3C3C"
        stroke-width="2.5"
      />
      <path
        d="M72.6094 62.5156L72.6094 94.7443"
        stroke="#3C3C3C"
        stroke-width="2.5"
      />
      <circle
        cx="130.469"
        cy="15.5319"
        r="14.2819"
        fill="white"
        stroke="#3C3C3C"
        stroke-width="2.5"
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
        stroke-width="5"
        mask="url(#path-5-inside-1_2239_12741)"
      />
      <circle
        cx="103.5"
        cy="107.5"
        r="26.5"
        fill="#44CE4B"
        fill-opacity="0.1"
      />
      <circle
        cx="103.532"
        cy="107.532"
        r="14.2819"
        fill="white"
        stroke="#3C3C3C"
        stroke-width="2.5"
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
      <rect width="69" height="71" rx="16" fill="#44CE4B" fill-opacity="0.1" />
      <path
        d="M32.5 71V107C32.5 109.333 33.9 114 39.5 114C45.1 114 67.5 114 78 114"
        stroke="url(#paint0_linear_2239_12741)"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-dasharray="3 3"
      />
      <rect
        x="78"
        y="26"
        width="167"
        height="147"
        rx="16"
        fill="#44CE4B"
        fill-opacity="0.1"
      />
      <path
        d="M40.6016 17.8594L47.6339 24.8917C48.4122 25.67 48.7991 26.0581 49.0774 26.5122C49.3242 26.9148 49.5067 27.3538 49.6169 27.813C49.7101 28.201 49.7341 28.6077 49.74 29.25C49.742 29.465 49.7422 29.7068 49.7422 29.9828V49.0581C49.7422 51.5734 49.7422 52.8311 49.2522 53.7927C48.8208 54.6395 48.1306 55.3286 47.2838 55.76C46.3222 56.25 45.0644 56.25 42.5491 56.25L25.4353 56.25C22.9199 56.25 21.6604 56.25 20.6987 55.76C19.852 55.3286 19.1641 54.6395 18.7327 53.7927C18.2422 52.8301 18.2422 51.5707 18.2422 49.0504V22.9504C18.2422 20.4302 18.2422 19.1691 18.7327 18.2065C19.1641 17.3598 19.852 16.6719 20.6987 16.2405C21.6613 15.75 22.9224 15.75 25.4426 15.75H35.5103C35.7863 15.75 36.0281 15.75 36.243 15.752C36.8853 15.7578 37.2901 15.7816 37.6781 15.8748C38.1373 15.985 38.5774 16.1668 38.98 16.4136C39.434 16.6918 39.8238 17.0816 40.6016 17.8594Z"
        fill="white"
      />
      <path
        d="M27.2422 47.25H40.7422M27.2422 40.5H40.7422M36.243 15.752C36.0281 15.75 35.7863 15.75 35.5103 15.75H25.4426C22.9224 15.75 21.6613 15.75 20.6987 16.2405C19.852 16.6719 19.1641 17.3598 18.7327 18.2065C18.2422 19.1691 18.2422 20.4302 18.2422 22.9504V49.0504C18.2422 51.5707 18.2422 52.8301 18.7327 53.7927C19.1641 54.6395 19.852 55.3286 20.6987 55.76C21.6604 56.25 22.9199 56.25 25.4353 56.25L42.5491 56.25C45.0644 56.25 46.3222 56.25 47.2838 55.76C48.1306 55.3286 48.8208 54.6395 49.2522 53.7927C49.7422 52.8311 49.7422 51.5734 49.7422 49.0581V29.9828C49.7422 29.7068 49.742 29.465 49.74 29.25M36.243 15.752C36.8853 15.7578 37.2901 15.7816 37.6781 15.8748C38.1373 15.985 38.5774 16.1668 38.98 16.4136C39.434 16.6918 39.8238 17.0816 40.6016 17.8594L47.6339 24.8917C48.4122 25.67 48.7991 26.0581 49.0774 26.5122C49.3242 26.9148 49.5067 27.3538 49.6169 27.813C49.7101 28.201 49.7341 28.6077 49.74 29.25M36.243 15.752L36.2422 22.0505C36.2422 24.5707 36.2422 25.8303 36.7327 26.7929C37.1641 27.6397 37.852 28.3286 38.6987 28.76C39.6604 29.25 40.92 29.25 43.4352 29.25H49.74"
        stroke="#3C3C3C"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M103.531 66.7344V100.128H218.079V66.7344"
        stroke="#3C3C3C"
        stroke-width="2.5"
      />
      <path
        d="M160.609 100.516L160.609 132.744"
        stroke="#3C3C3C"
        stroke-width="2.5"
      />
      <circle
        cx="218.469"
        cy="53.5319"
        r="14.2819"
        fill="white"
        stroke="#3C3C3C"
        stroke-width="2.5"
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
        stroke-width="5"
        mask="url(#path-9-inside-1_2239_12741)"
      />
      <circle
        cx="160.61"
        cy="146.727"
        r="14.2819"
        fill="white"
        stroke="#3C3C3C"
        stroke-width="2.5"
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
          <stop stop-color="#93D696" />
          <stop offset="1" stop-color="white" />
        </linearGradient>
      </defs>
    </svg>
  );
}
