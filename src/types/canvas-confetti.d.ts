// TODO: 삭제 예정 - canvas-confetti 라이브러리 미사용, react-confetti로 대체되었으나 그것도 미사용
declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    zIndex?: number;
    disableForReducedMotion?: boolean;
    useWorker?: boolean;
    scalar?: number;
  }

  function confetti(options?: Options): Promise<void> | null;
  export default confetti;
}
