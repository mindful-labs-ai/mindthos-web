import type { Template } from './index';

export interface GetTemplatesResponse {
  success: boolean;
  templates: Template[];
}

export interface GetTemplatePinsRequest {
  user_id: string;
}

export interface GetTemplatePinsResponse {
  success: boolean;
  template_ids: number[];
}

export interface ToggleTemplatePinRequest {
  user_id: string;
  template_id: number;
}

export interface ToggleTemplatePinResponse {
  success: boolean;
  pinned: boolean;
  message?: string;
}

export interface SetDefaultTemplateRequest {
  user_id: string;
  template_id: number | null;
}

export interface SetDefaultTemplateResponse {
  success: boolean;
  message?: string;
}

export interface TemplateApiError {
  status: number;
  success: false;
  error: string;
  message: string;
}
