export interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
  created_at: string;
  updated_at: string;
  content: string;
  is_default: boolean;
  pin: boolean;
}

export interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  content: string;
  is_default: boolean;
  pin: boolean;
}
