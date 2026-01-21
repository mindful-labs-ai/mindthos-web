// Person
export enum Gender {
  Male = 'MALE',
  Female = 'FEMALE',
  TransMtF = 'TRANS_MTF',
  TransFtM = 'TRANS_FTM',
  NonBinary = 'NON_BINARY',
  Pet = 'PET',
}

export enum SexualOrientation {
  Heterosexual = 'HETEROSEXUAL',
  LGB = 'LGB',
}

export enum ClinicalStatus {
  None = 'NONE',
  PhysicalMental = 'PHYSICAL_MENTAL',
  SubstanceAbuse = 'SUBSTANCE_ABUSE',
  SuspectedAbuse = 'SUSPECTED_ABUSE',
  InRemission = 'IN_REMISSION',
  InRecovery = 'IN_RECOVERY',
  Comorbidity = 'COMORBIDITY',
}

export enum MigrationStatus {
  None = 'NONE',
  Immigrant = 'IMMIGRANT',
  MultiCultural = 'MULTI_CULTURAL',
}

// Relationship
export enum RelationType {
  Partner = 'PARTNER',
  Child = 'CHILD',
  Emotional = 'EMOTIONAL',
  Group = 'GROUP',
}

export enum PartnerStatus {
  Married = 'MARRIED',
  Separated = 'SEPARATED',
  Divorced = 'DIVORCED',
  Reunited = 'REUNITED',
  Dating = 'DATING',
  SecretAffair = 'SECRET_AFFAIR',
}

export enum ChildStatus {
  Biological = 'BIOLOGICAL',
  Adopted = 'ADOPTED',
  Foster = 'FOSTER',
  Miscarriage = 'MISCARRIAGE',
  Abortion = 'ABORTION',
  Twins = 'TWINS',
  IdenticalTwins = 'IDENTICAL_TWINS',
}

export enum EmotionalStatus {
  Basic = 'BASIC',
  Close = 'CLOSE',
  Fused = 'FUSED',
  Distant = 'DISTANT',
  Hostile = 'HOSTILE',
  FusedHostile = 'FUSED_HOSTILE',
  Cutoff = 'CUTOFF',
  Abuse = 'ABUSE',
  FocusedOn = 'FOCUSED_ON',
}

// Layout
export enum NodeSize {
  Small = 'SMALL',
  Default = 'DEFAULT',
  Large = 'LARGE',
}

export enum LineStyle {
  Solid = 'SOLID',
  Dashed = 'DASHED',
  Dotted = 'DOTTED',
  Double = 'DOUBLE',
  Triple = 'TRIPLE',
  Zigzag = 'ZIGZAG',
}

export enum ArrowDirection {
  None = 'NONE',
  Forward = 'FORWARD',
  Backward = 'BACKWARD',
  Both = 'BOTH',
}

// Editor
export enum ToolMode {
  Select = 'SELECT',
  MultiSelect = 'MULTI_SELECT',
  Pan = 'PAN',
  CreateNode = 'CREATE_NODE',
  Connect = 'CONNECT',
  CreateText = 'CREATE_TEXT',
}

export enum AssetType {
  Node = 'NODE',
  Edge = 'EDGE',
  Text = 'TEXT',
}
