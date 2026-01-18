/**
 * View Settings
 * 화면 표시 설정 관리
 */

/**
 * 표시 항목 설정
 */
export interface ViewDisplaySettings {
  /** 이름 표시 */
  showName: boolean;

  /** 나이 표시 */
  showAge: boolean;

  /** 출생일/사망일 표시 */
  showDates: boolean;

  /** 직업 표시 */
  showOccupation: boolean;

  /** 거주지 표시 */
  showResidence: boolean;

  /** 임상 정보 표시 */
  showClinicalInfo: boolean;

  /** 관계선 레이블 표시 */
  showRelationshipLabels: boolean;

  /** 메모 표시 */
  showMemos: boolean;

  /** 그리드 표시 */
  showGrid: boolean;

  /** 세대 가이드라인 표시 */
  showGenerationGuides: boolean;
}

/**
 * View Settings 변경 리스너
 */
export type ViewSettingsChangeListener = (
  settings: ViewDisplaySettings,
) => void;

/**
 * View Settings Manager
 * 화면에 표시할 정보 선택 관리
 */
export class ViewSettings {
  private settings: ViewDisplaySettings;
  private listeners: ViewSettingsChangeListener[] = [];

  constructor(initialSettings?: Partial<ViewDisplaySettings>) {
    // 기본값: 모두 표시
    this.settings = {
      showName: true,
      showAge: true,
      showDates: true,
      showOccupation: true,
      showResidence: true,
      showClinicalInfo: true,
      showRelationshipLabels: true,
      showMemos: true,
      showGrid: false,
      showGenerationGuides: true,
      ...initialSettings,
    };
  }

  /**
   * 현재 설정 조회
   */
  getSettings(): Readonly<ViewDisplaySettings> {
    return { ...this.settings };
  }

  /**
   * 개별 설정 조회
   */
  getSetting<K extends keyof ViewDisplaySettings>(
    key: K,
  ): ViewDisplaySettings[K] {
    return this.settings[key];
  }

  /**
   * 설정 업데이트
   */
  updateSettings(updates: Partial<ViewDisplaySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.notifyListeners();
  }

  /**
   * 개별 설정 토글
   */
  toggleSetting(key: keyof ViewDisplaySettings): void {
    this.settings[key] = !this.settings[key];
    this.notifyListeners();
  }

  /**
   * 모두 표시
   */
  showAll(): void {
    this.settings = {
      showName: true,
      showAge: true,
      showDates: true,
      showOccupation: true,
      showResidence: true,
      showClinicalInfo: true,
      showRelationshipLabels: true,
      showMemos: true,
      showGrid: true,
      showGenerationGuides: true,
    };
    this.notifyListeners();
  }

  /**
   * 최소 표시 (이름만)
   */
  showMinimal(): void {
    this.settings = {
      showName: true,
      showAge: false,
      showDates: false,
      showOccupation: false,
      showResidence: false,
      showClinicalInfo: false,
      showRelationshipLabels: false,
      showMemos: false,
      showGrid: false,
      showGenerationGuides: false,
    };
    this.notifyListeners();
  }

  /**
   * 임상 정보만 표시
   */
  showClinicalOnly(): void {
    this.settings = {
      showName: true,
      showAge: true,
      showDates: false,
      showOccupation: false,
      showResidence: false,
      showClinicalInfo: true,
      showRelationshipLabels: true,
      showMemos: true,
      showGrid: false,
      showGenerationGuides: true,
    };
    this.notifyListeners();
  }

  /**
   * 설정 변경 리스너 등록
   */
  addListener(listener: ViewSettingsChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * 설정 변경 리스너 제거
   */
  removeListener(listener: ViewSettingsChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 리스너들에게 알림
   */
  private notifyListeners(): void {
    const settings = this.getSettings();
    this.listeners.forEach((listener) => listener(settings));
  }

  /**
   * JSON으로 직렬화
   */
  serialize(): ViewDisplaySettings {
    return { ...this.settings };
  }

  /**
   * JSON에서 복원
   */
  static deserialize(data: ViewDisplaySettings): ViewSettings {
    return new ViewSettings(data);
  }
}
