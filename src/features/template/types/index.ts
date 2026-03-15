export interface Template {
  id: number;
  title: string;
  description: string;
  prompt: string;
  created_at: string;
}

export interface TemplateListItem extends Template {
  pin: boolean;
  is_default: boolean;
}
