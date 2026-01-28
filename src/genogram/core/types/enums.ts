// Subject
export const SubjectType = {
  Person: 'PERSON',
  Animal: 'ANIMAL',
} as const;
export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];

export const Gender = {
  남성: '남성',
  여성: '여성',
  게이: '게이',
  레즈비언: '레즈비언',
  트랜스젠더_남성: '트랜스젠더_남성',
  트랜스젠더_여성: '트랜스젠더_여성',
  논바이너리: '논바이너리',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const ClinicStatus = {
  없음: '없음',
  심리적_신체적_문제: '심리적_신체적_문제',
  알코올_약물_남용: '알코올_약물_남용',
  알코올_약물_남용_의심: '알코올_약물_남용_의심',
  완화된_심리적_신체적_문제: '완화된_심리적_신체적_문제',
  완화된_알코올_약물_문제와_심리적_신체적_문제:
    '완화된_알코올_약물_문제와_심리적_신체적_문제',
  알코올_약물_문제_회복_중: '알코올_약물_문제_회복_중',
  심각한_심리적_신체적_질환과_심각한_알코올_약물_문제:
    '심각한_심리적_신체적_질환과_심각한_알코올_약물_문제',
  심리적_신체적_질환과_심각한_알코올_약물_문제_회복_중:
    '심리적_신체적_질환과_심각한_알코올_약물_문제_회복_중',
} as const;
export type ClinicStatus = (typeof ClinicStatus)[keyof typeof ClinicStatus];

// Connection
export const ConnectionType = {
  관계선: '관계선',
  영향선: '영향선',
  파트너선: '파트너선',
  부모자식선: '부모자식선',
  그룹선: '그룹선',
} as const;
export type ConnectionType =
  (typeof ConnectionType)[keyof typeof ConnectionType];

export const RelationStatus = {
  연결: '연결',
  친밀: '친밀',
  융합: '융합',
  소원: '소원',
  적대: '적대',
  친밀적대: '친밀적대',
} as const;
export type RelationStatus =
  (typeof RelationStatus)[keyof typeof RelationStatus];

export const InfluenceStatus = {
  신체적학대: '신체적학대',
  정신적학대: '정신적학대',
  성적학대: '성적학대',
  집중됨: '집중됨',
  부정적집중됨: '부정적집중됨',
} as const;
export type InfluenceStatus =
  (typeof InfluenceStatus)[keyof typeof InfluenceStatus];

export const PartnerStatus = {
  결혼: '결혼',
  별거: '별거',
  이혼: '이혼',
  재결합: '재결합',
  연애: '연애',
  비밀연애: '비밀연애',
} as const;
export type PartnerStatus = (typeof PartnerStatus)[keyof typeof PartnerStatus];

export const ParentChildStatus = {
  친자녀: '친자녀',
  유산: '유산',
  낙태: '낙태',
  임신: '임신',
  쌍둥이: '쌍둥이',
  일란성쌍둥이: '일란성쌍둥이',
  입양자녀: '입양자녀',
  위탁자녀: '위탁자녀',
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
  단일선택도구: '단일선택도구',
  다중선택도구: '다중선택도구',
  이동도구: '이동도구',
  인물추가도구: '인물추가도구',
  관계추가도구: '관계추가도구',
  주석달기도구: '주석달기도구',
} as const;
export type ToolMode = (typeof ToolMode)[keyof typeof ToolMode];

export const AssetType = {
  Node: 'NODE',
  Edge: 'EDGE',
  Text: 'TEXT',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];
