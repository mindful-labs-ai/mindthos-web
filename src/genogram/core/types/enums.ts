// Subject
export const SubjectType = {
  Person: 'PERSON',
  Animal: 'ANIMAL',
} as const;
export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];

export const Gender = {
  Male: 'Male',
  Female: 'Female',
  Gay: 'Gay',
  Lesbian: 'Lesbian',
  Transgender_Male: 'Transgender_Male',
  Transgender_Female: 'Transgender_Female',
  Nonbinary: 'Nonbinary',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const Illness = {
  None: 'None',
  Psychological_Or_Physical_Problem: 'Psychological_Or_Physical_Problem',
  Alcohol_Or_Drug_Abuse: 'Alcohol_Or_Drug_Abuse',
  Suspected_Alcohol_Or_Drug_Abuse: 'Suspected_Alcohol_Or_Drug_Abuse',
  Psychological_Or_Physical_Illness_In_Remission:
    'Psychological_Or_Physical_Illness_In_Remission',
  In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems:
    'In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems',
  In_Recovery_From_Substance_Abuse: 'In_Recovery_From_Substance_Abuse',
  Serious_Mental_Or_Physical_Problems_And_Substance_Abuse:
    'Serious_Mental_Or_Physical_Problems_And_Substance_Abuse',
  In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems:
    'In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems',
} as const;
export type Illness = (typeof Illness)[keyof typeof Illness];

// Connection
export const ConnectionType = {
  Relation_Line: 'Relation_Line',
  Influence_Line: 'Influence_Line',
  Partner_Line: 'Partner_Line',
  Children_Parents_Line: 'Children_Parents_Line',
  Group_Line: 'Group_Line',
} as const;
export type ConnectionType =
  (typeof ConnectionType)[keyof typeof ConnectionType];

export const RelationStatus = {
  Connected: 'Connected',
  Close: 'Close',
  Fused: 'Fused',
  Distant: 'Distant',
  Hostile: 'Hostile',
  Close_Hostile: 'Close_Hostile',
} as const;
export type RelationStatus =
  (typeof RelationStatus)[keyof typeof RelationStatus];

export const InfluenceStatus = {
  Physical_Abuse: 'Physical_Abuse',
  Emotional_Abuse: 'Emotional_Abuse',
  Sexual_Abuse: 'Sexual_Abuse',
  Focused_On: 'Focused_On',
  Focused_On_Negatively: 'Focused_On_Negatively',
} as const;
export type InfluenceStatus =
  (typeof InfluenceStatus)[keyof typeof InfluenceStatus];

export const PartnerStatus = {
  Marriage: 'Marriage',
  Marital_Separation: 'Marital_Separation',
  Divorce: 'Divorce',
  Remarriage: 'Remarriage',
  Couple_Relationship: 'Couple_Relationship',
  Secret_Affair: 'Secret_Affair',
} as const;
export type PartnerStatus = (typeof PartnerStatus)[keyof typeof PartnerStatus];

export const ParentChildStatus = {
  Biological_Child: 'Biological_Child',
  Miscarriage: 'Miscarriage',
  Abortion: 'Abortion',
  Pregnancy: 'Pregnancy',
  Twins: 'Twins',
  Identical_Twins: 'Identical_Twins',
  Adopted_Child: 'Adopted_Child',
  Foster_Child: 'Foster_Child',
} as const;
export type ParentChildStatus =
  (typeof ParentChildStatus)[keyof typeof ParentChildStatus];

// Layout / Style
export const NodeSize = {
  Small: 'SMALL',
  Default: 'DEFAULT',
  Large: 'LARGE',
} as const;
export type NodeSize = (typeof NodeSize)[keyof typeof NodeSize];

export const StrokeWidth = {
  Thin: 'THIN',
  Default: 'DEFAULT',
  Thick: 'THICK',
} as const;
export type StrokeWidth = (typeof StrokeWidth)[keyof typeof StrokeWidth];

// Editor
export const ToolMode = {
  Select_Tool: 'Select_Tool',
  Multi_Select_Tool: 'Multi_Select_Tool',
  Pan_Tool: 'Pan_Tool',
  Create_Subject_Tool: 'Create_Subject_Tool',
  Create_Connection_Tool: 'Create_Connection_Tool',
  Create_Annotation_Tool: 'Create_Annotation_Tool',
} as const;
export type ToolMode = (typeof ToolMode)[keyof typeof ToolMode];

export const AssetType = {
  Node: 'NODE',
  Edge: 'EDGE',
  Text: 'TEXT',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];
