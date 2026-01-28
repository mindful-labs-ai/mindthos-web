import type { Visibility } from '../models/genogram';

/**
 * View Settings
 * SDD visibility 구조에 맞춘 화면 표시 설정 관리
 */

export type ViewDisplaySettings = Visibility;

export type ViewSettingsChangeListener = (
  settings: ViewDisplaySettings
) => void;

export class ViewSettings {
  private settings: ViewDisplaySettings;
  private listeners: ViewSettingsChangeListener[] = [];

  constructor(initialSettings?: Partial<ViewDisplaySettings>) {
    this.settings = {
      name: true,
      age: true,
      birthDate: true,
      deathDate: true,
      detail: true,
      clinicStatus: true,
      relationLine: true,
      groupLine: true,
      grid: false,
      memo: true,
      ...initialSettings,
    };
  }

  getSettings(): Readonly<ViewDisplaySettings> {
    return { ...this.settings };
  }

  getSetting<K extends keyof ViewDisplaySettings>(
    key: K
  ): ViewDisplaySettings[K] {
    return this.settings[key];
  }

  updateSettings(updates: Partial<ViewDisplaySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.notifyListeners();
  }

  toggleSetting(key: keyof ViewDisplaySettings): void {
    this.settings[key] = !this.settings[key];
    this.notifyListeners();
  }

  showAll(): void {
    this.settings = {
      name: true,
      age: true,
      birthDate: true,
      deathDate: true,
      detail: true,
      clinicStatus: true,
      relationLine: true,
      groupLine: true,
      grid: true,
      memo: true,
    };
    this.notifyListeners();
  }

  showMinimal(): void {
    this.settings = {
      name: true,
      age: false,
      birthDate: false,
      deathDate: false,
      detail: false,
      clinicStatus: false,
      relationLine: false,
      groupLine: false,
      grid: false,
      memo: false,
    };
    this.notifyListeners();
  }

  showClinicalOnly(): void {
    this.settings = {
      name: true,
      age: true,
      birthDate: false,
      deathDate: false,
      detail: false,
      clinicStatus: true,
      relationLine: true,
      groupLine: true,
      grid: false,
      memo: true,
    };
    this.notifyListeners();
  }

  addListener(listener: ViewSettingsChangeListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: ViewSettingsChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    const settings = this.getSettings();
    this.listeners.forEach((listener) => listener(settings));
  }

  serialize(): ViewDisplaySettings {
    return { ...this.settings };
  }

  static deserialize(data: ViewDisplaySettings): ViewSettings {
    return new ViewSettings(data);
  }
}
