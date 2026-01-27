// Subject
export const SubjectType = {
  Person: 'PERSON',
  Animal: 'ANIMAL',
} as const;
export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];

export const Gender = {
  Male: 'MALE',
  Female: 'FEMALE',
  Gay: 'GAY',
  Lesbian: 'LESBIAN',
  TransMale: 'TRANS_MALE',
  TransFemale: 'TRANS_FEMALE',
  NonBinary: 'NON_BINARY',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const ClinicStatus = {
  None: 'NONE',
  PsychPhysicalProblem: 'PSYCH_PHYSICAL_PROBLEM',
  SubstanceAbuse: 'SUBSTANCE_ABUSE',
  SuspectedSubstanceAbuse: 'SUSPECTED_SUBSTANCE_ABUSE',
  RemissionPsychPhysical: 'REMISSION_PSYCH_PHYSICAL',
  SubstanceRemissionWithProblem: 'SUBSTANCE_REMISSION_WITH_PROBLEM',
  RecoveringSubstanceAbuse: 'RECOVERING_SUBSTANCE_ABUSE',
  SevereMultipleProblems: 'SEVERE_MULTIPLE_PROBLEMS',
  RecoveringMultipleProblems: 'RECOVERING_MULTIPLE_PROBLEMS',
} as const;
export type ClinicStatus = (typeof ClinicStatus)[keyof typeof ClinicStatus];

// Connection
export const ConnectionType = {
  Relation: 'RELATION',
  Influence: 'INFLUENCE',
  Partner: 'PARTNER',
  ParentChild: 'PARENT_CHILD',
  Group: 'GROUP',
} as const;
export type ConnectionType =
  (typeof ConnectionType)[keyof typeof ConnectionType];

export const RelationStatus = {
  Link: 'LINK',
  Close: 'CLOSE',
  Combination: 'COMBINATION',
  Estranged: 'ESTRANGED',
  Hostility: 'HOSTILITY',
  CloseHostility: 'CLOSE_HOSTILITY',
} as const;
export type RelationStatus =
  (typeof RelationStatus)[keyof typeof RelationStatus];

export const InfluenceStatus = {
  PhysicalAbuse: 'PHYSICAL_ABUSE',
  MentalAbuse: 'MENTAL_ABUSE',
  SexualAbuse: 'SEXUAL_ABUSE',
  Focus: 'FOCUS',
  NegativeFocus: 'NEGATIVE_FOCUS',
} as const;
export type InfluenceStatus =
  (typeof InfluenceStatus)[keyof typeof InfluenceStatus];

export const PartnerStatus = {
  Married: 'MARRIED',
  Separated: 'SEPARATED',
  Divorced: 'DIVORCED',
  Reunited: 'REUNITED',
  Dating: 'DATING',
  SecretDating: 'SECRET_DATING',
} as const;
export type PartnerStatus =
  (typeof PartnerStatus)[keyof typeof PartnerStatus];

export const ParentChildStatus = {
  Biological: 'BIOLOGICAL',
  Miscarriage: 'MISCARRIAGE',
  Abortion: 'ABORTION',
  Twins: 'TWINS',
  IdenticalTwins: 'IDENTICAL_TWINS',
  AdoptedChild: 'ADOPTED_CHILD',
  FosterChild: 'FOSTER_CHILD',
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
  Select: 'SELECT',
  MultiSelect: 'MULTI_SELECT',
  Pan: 'PAN',
  CreateNode: 'CREATE_NODE',
  Connect: 'CONNECT',
  CreateText: 'CREATE_TEXT',
} as const;
export type ToolMode = (typeof ToolMode)[keyof typeof ToolMode];

export const AssetType = {
  Node: 'NODE',
  Edge: 'EDGE',
  Text: 'TEXT',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];
