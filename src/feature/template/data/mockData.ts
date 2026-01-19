import type { Template } from '../types';

export const mockTemplates: Template[] = [
  {
    id: '4c54d32a-e437-4e61-a3da-85b15d76731c',
    name: '마음토스 상담 노트',
    description: '마음토스 연구진이 제공하는 기본 노트',
    prompt:
      '당신은 20년 이상의 경력을 지닌 심리상담사입니다. 사용자로부터 상담 대화의 transcript를 입력받으면, 그 내용을 기반으로 아래 상담 기록을 작성해야 합니다.',
    created_at: '2025-04-04T09:15:45.623500+00',
    updated_at: '2025-04-21T12:34:48.661847+00',
    content:
      "마음토스 상담 노트는 다음 내용을 포함합니다:\n\n- 상담 주제 Therapy Issue: \n- 상담 목표 Therapeutic Goal: \n- 내담자 반응 Client's Response: \n- 선생님 소견 Therapist's Assessment: \n- 상담 내용 (기법 및 개입 방안) Intervention: \n- 다음 회기 계획 Next Session Plan: \n- 평가 및 진단 Evaluation:",
    is_default: true,
    pin: true,
  },
  {
    id: 'ec4ccab8-9686-4e28-83cc-4d771a0a3b96',
    name: '사례 개념화 노트 (CBT-인지행동치료)',
    description: '인지행동치료(CBT) 기반의 사례 개념화 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, 인지행동치료(CBT) 전문가입니다.',
    created_at: '2025-04-04T05:57:24.981278+00',
    updated_at: '2025-04-27T08:23:53.547320+00',
    content:
      'CBT 사례 개념화는 다음 항목을 포함합니다.\n1. 호소 문제 (Presenting Problem)\n2. 문제 상황 예시 (Triggering Situations)\n3. 자동적 사고 (Automatic Thoughts)\n4. 관련 감정 (Associated Emotions)\n5. 행동 반응 (Behavioral Responses)\n6. 핵심 신념 (Core Beliefs)\n7. 인지적 오류 (Cognitive Distortions)\n8. 유지 요인 (Maintaining Factors)\n9. 보호 요인 및 자원 (Strengths & Protective Factors)\n10. 개입 목표 (Intervention Goals)\n11. 개입 전략 (Intervention Strategies)',
    is_default: false,
    pin: false,
  },
  {
    id: 'd4e810d5-74c3-4f30-8393-5210356d0a24',
    name: '사례 개념화 노트 (ACT-수용전념치료)',
    description: '수용전념치료(ACT) 기반의 사례 개념화 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, 수용전념치료(ACT) 전문가입니다.',
    created_at: '2025-04-11T07:12:58.222176+00',
    updated_at: '2025-04-27T08:23:59.505003+00',
    content:
      'ACT 사례 개념화는 다음 항목을 포함합니다.\n1.호소 문제 (Presenting Problem)\n2.고통스러운 내면 경험 (Unwanted Internal Experiences)\n3.경험 회피 (Experiential Avoidance)\n4.인지적 융합 (Cognitive Fusion)\n5.가치 (Values)\n6.가치와 불일치하는 행동 (Values-Incongruent Behaviors)\n7.심리적 유연성의 장애요인 (Psychological Inflexibility Factors)\n8.심리적 유연성 촉진 요인 (Strengths & Flexibility Resources)\n9.개입 목표 (Therapeutic Goals)\n10.개입 전략 (ACT Strategies)',
    is_default: false,
    pin: true,
  },
  {
    id: '9cd65596-2156-4edc-8f62-2819b1e764bb',
    name: '사례 개념화 노트 (보웬가족치료)',
    description: '보웬가족치료 기반의 사례 개념화 노트',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, 보웬 가족치료(Bowen Family Systems Theory) 전문가입니다.',
    created_at: '2025-04-27T08:27:28.580996+00',
    updated_at: '2025-05-01T08:37:53.540019+00',
    content:
      '보웬가족치료 사례개념화는 다음의 내용을 포함합니다.\n\n1.호소 문제 (Presenting Problem)\n2.핵가족 정서체계 (Nuclear Family Emotional System)\n3.자기 분화 수준 (Level of Differentiation)\n4.삼각관계 (Triangles)\n5.가족 투사 과정 (Family Projection Process)\n6.다세대 전수 (Multigenerational Transmission)\n7.정서적 단절 (Emotional Cutoff)\n8.강점 및 보호 요인 (Strengths & Protective Factors)\n9.개입 목표 (Intervention Goals)\n10.개입 전략 (Intervention Strategies)',
    is_default: false,
    pin: true,
  },
  {
    id: '125ec184-9148-4959-97d3-ca4159367489',
    name: '사례 개념화 노트 (인간중심상담)',
    description: '인간중심상담 사례 개념화 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, **인간중심상담(Person-Centered Counseling)** 전문가입니다.',
    created_at: '2025-04-27T08:49:18.101598+00',
    updated_at: '2025-04-27T08:49:36.107172+00',
    content:
      'Carl Rogers의 이론을 적용한 인간중심상담 사례 개념화는 다음 항목을 포함합니다.\n1. 호소 문제 (Presenting Problem)\n2. 자기개념 (Self-Concept)\n3. 이상적 자기와 실제 자기 간의 괴리 (Incongruence)\n4. 감정 표현과 수용 정도 (Emotional Expression and Acceptance)\n5. 조건부 가치 부여 (Conditions of Worth)\n6. 진정성/일관성 (Authenticity/Congruence)\n7. 잠재적 성장 가능성 (Potential for Growth)\n8. 현재 상담적 관계에서 관찰되는 변화 조짐 (Emerging Changes)\n9. 강점 및 보호 요인 (Strengths & Protective Factors)\n10. 개입 목표 (Intervention Goals)\n11. 개입 전략 (Intervention Strategies)',
    is_default: false,
    pin: false,
  },
  {
    id: '8ec123b0-15fd-4647-ac36-a04e18f3ab49',
    name: '사례 개념화 노트 (DBT-변증법적행동치료)',
    description: '변증법적행동치료(DBT) 사례 개념화 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, **변증법적 행동치료(Dialectical Behavior Therapy, DBT)** 전문가입니다.',
    created_at: '2025-04-27T08:50:19.427688+00',
    updated_at: '2025-04-27T08:50:19.427688+00',
    content:
      'DBT 사례 개념화는 다음 항목을 포함합니다.\n1. 호소 문제 (Presenting Problem)\n2. 정서조절의 어려움 (Emotion Regulation Difficulties)\n3. 충동성 문제 (Impulsivity)\n4. 대인관계 어려움 (Interpersonal Difficulties)\n5. 인지적 경직성 vs 변증적 사고 수준 (Cognitive Rigidity vs Dialectical Thinking)\n6. 자기정체감 혼란 (Identity Disturbance)\n7. 주요 방아쇠 상황 (Triggering Situations)\n8. 기능적 행동 분석 (Functional Behavior Analysis)\n9. 보호 요인 및 강점 (Strengths & Protective Factors)\n10. 개입 목표 (Intervention Goals)\n11. 개입 전략 (Intervention Strategies)',
    is_default: false,
    pin: false,
  },
  {
    id: '411c480c-ab4e-4d72-a0df-0eed3ba81af6',
    name: '사례 개념화 노트 (MI-동기강화상담)',
    description: '동기강화상담(MI) 사례 개념화 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, **동기강화상담(Motivational Interviewing, MI)** 전문가입니다.',
    created_at: '2025-04-27T08:50:55.922585+00',
    updated_at: '2025-04-27T08:50:55.922585+00',
    content:
      'MI 사례 개념화는 다음 항목을 포함합니다.\n1. 호소 문제 (Presenting Problem)\n2. 변화에 대한 언어 (Change Talk)\n3. 지속에 대한 언어 (Sustain Talk)\n4. 양가감정 (Ambivalence)\n5. 자율성 인식 (Autonomy)\n6. 변화 준비도 (Readiness for Change)\n7. 주요 장애 요인 (Barriers to Change)\n8. 강점 및 보호 요인 (Strengths & Protective Factors)\n9. 개입 목표 (Intervention Goals)\n10. 개입 전략 (Intervention Strategies)',
    is_default: false,
    pin: false,
  },
  {
    id: '13dffa5e-4601-4783-83da-e9c676a600e3',
    name: '사례 개념화 노트 (아들러 심리치료)',
    description: '아들러 심리치료 사례 개념화 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, **아들러 심리치료(Adlerian Therapy)** 전문가입니다.',
    created_at: '2025-04-27T08:51:32.694719+00',
    updated_at: '2025-04-27T08:51:32.694719+00',
    content:
      '아들러의 개별 심리학(Individual Psychology)기반 심리치료 사례 개념화는 다음 항목을 포함합니다.\n1. 호소 문제 (Presenting Problem)\n2. 주요 열등감 경험 (Inferiority Feelings)\n3. 보상 양식 및 삶의 목표 (Compensation and Life Goals)\n4. 생활양식 (Lifestyle)\n5. 가족 구성과 초기 기억 (Family Constellation and Early Recollections)\n6. 사회적 관심 수준 (Level of Social Interest)\n7. 주요 방어 패턴 (Defensive Behaviors)\n8. 삶의 과제에 대한 접근 (Approach to Life Tasks)\n9. 강점 및 보호 요인 (Strengths & Protective Factors)\n10. 개입 목표 (Intervention Goals)\n11. 개입 전략 (Intervention Strategies)',
    is_default: false,
    pin: false,
  },
  {
    id: '9d22be09-648f-435f-87ed-c48028c51618',
    name: '사례 개념화 노트 (게슈탈트 심리치료)',
    description: '게슈탈트(Gestalt) 심리치료 사례 개념화 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, **게슈탈트 심리치료(Gestalt Therapy)** 전문가입니다.',
    created_at: '2025-04-27T08:52:07.166240+00',
    updated_at: '2025-04-27T08:52:07.166240+00',
    content:
      '게슈탈트(Gestalt) 심리치료 사례 개념화는 다음 항목을 포함합니다.\n1. 호소 문제 (Presenting Problem)\n2. 현재 경험에 대한 인식 (Awareness of Here and Now Experience)\n3. 접촉 경계 문제 (Contact Boundary Disturbances)\n4. 미해결 과제 (Unfinished Business)\n5. 책임감 수준 (Ownership and Responsibility)\n6. 감정 억압 또는 차단 (Blocked or Suppressed Emotions)\n7. 자기와 환경 사이의 상호작용 (Self-Environment Interaction)\n8. 회피 패턴 (Avoidance Patterns)\n9. 강점 및 보호 요인 (Strengths & Protective Factors)\n10. 개입 목표 (Intervention Goals)\n11. 개입 전략 (Intervention Strategies)',
    is_default: false,
    pin: false,
  },
  {
    id: 'df52e98e-3ee5-4d3a-877c-3dbef2b5c692',
    name: '접수면접 노트',
    description:
      '접수 면접 (Intake Interview) 진행 시 정리에 도움을 주는 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이며, 심리상담 초기 평가 및 접수면접(intake interview) 작성에 숙련된 전문가입니다.',
    created_at: '2025-04-27T13:44:14.926273+00',
    updated_at: '2025-04-27T13:44:14.926273+00',
    content:
      '다음의 내용이 축어록에 포함될 경우 정리합니다.\n1. 일반 정보 (Identifying Information)\n2. 의뢰 사유 (Presenting Problem)\n3. 정신건강 이력 (Mental Health History)\n4. 의학적 이력 (Medical History)\n5. 가족 및 사회 관계 (Family and Social History)\n6. 발달 이력 (Developmental History)\n7. 직업 및 학업 상태 (Occupational and Educational History)\n8. 현재 기능 수준 (Current Functioning)\n9. 내담자 관찰 (Behavioral Observations)\n10. 예비 진단 및 고려 사항 (Preliminary Impressions)\n11. 초기 상담 목표 및 계획 (Initial Treatment Plan)',
    is_default: false,
    pin: false,
  },
  {
    id: '55e3597b-bcd3-4945-bf05-77d94654c6c9',
    name: '사례 개념화 노트 (사티어 경험적가족치료)',
    description: '사티어 경험적가족치료 사례 개념화 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, 사티어 경험적 가족치료(Satir Growth Model) 전문가입니다.',
    created_at: '2025-05-01T08:42:56.429800+00',
    updated_at: '2025-05-01T08:50:02.177486+00',
    content:
      '사티어 경험적가족치료 사례 개념화 노트는 다음 내용을 포함합니다. \n\n1. 호소 문제 (Presenting Problem)\n2. 의사소통 유형 (Communication Patterns)\n3. 자아존중감 평가 (Self-Esteem Assessment)\n4. 빙산 탐색 (Iceberg Exploration)\n5. 가족 규칙과 신념 (Family Rules & Beliefs)\n6. 가족 조각과 역할 (Family Sculpting & Roles)\n7. 변화 동기와 저항 (Motivation for Change & Resistance)\n8. 사회문화적 맥락 (Socio-Cultural Context)\n9. 강점 및 회복 자원 (Strengths & Protective Factors)\n10. 개입 목표 (Intervention Goals)\n11. 개입 전략 (Intervention Strategies)',
    is_default: false,
    pin: false,
  },
  {
    id: 'cef426d9-7e3e-46dd-9dfd-885ae42086dd',
    name: '사례 개념화 노트 (미누친 구조적가족치료)',
    description: '미누친 구조적가족치료(SFT) 사례 개념화 노트입니다.',
    prompt:
      '당신은 20년 이상의 임상 경험을 보유한 심리상담사이자, 미누친 구조적 가족치료(Structural Family Therapy, SFT) 전문가입니다.',
    created_at: '2025-05-01T08:40:20.378575+00',
    updated_at: '2025-05-01T08:48:51.761500+00',
    content:
      '1. 호소 문제 (Presenting Problem)\n2. 가족 구조 및 하위체계 (Family Structure & Sub-systems)\n3. 경계선 및 위계 (Boundaries & Hierarchy)\n4. 연합 및 공조 (Coalitions & Alignments)\n5. 증상의 가족 기능 (Symptom Function in Family Interaction)\n6. 가족 발달 단계 및 외부 스트레스 (Family Life-Cycle & External Stressors)\n7. 구조적 불균형 요인 (Structural Imbalances)\n8. 사회·문화적 맥락 (Socio-Cultural Context)\n9. 강점 및 보호 요인 (Strengths & Protective Factors)\n10. 개입 목표 (Intervention Goals)\n11. 개입 전략 (Intervention Strategies)',
    is_default: false,
    pin: false,
  },
  {
    id: '1a152a5d-3216-4b7e-864d-ffff7dc08870',
    name: 'EAP 상담 노트',
    description: '각종 EAP 상담 기록에 맞춘 노트',
    prompt:
      '당신은 20년 이상의 경력을 지닌 심리상담사입니다. 사용자로부터 상담 대화의 transcript를 입력받으면, 그 내용을 기반으로 아래 상담 기록을 작성해야 합니다.',
    created_at: '2025-04-04T02:30:54.643618+00',
    updated_at: '2025-04-21T12:34:48.661847+00',
    content:
      'EAP 상담기록은 다음 내용을 포함합니다.\n\n- 상담 주제 \n- 상담 목표\n- 내담자 반응\n- 선생님 소견 및 특이사항\n- 상담 내용 (기법 및 개입 방안)\n- 다음 회기 계획',
    is_default: false,
    pin: false,
  },
  {
    id: '2fb4c3e3-2f89-4e73-8b1d-80d898241998',
    name: '가족센터 상담 노트',
    description: '가족센터 상담 기록에 맞춘 노트',
    prompt:
      '당신은 20년 이상의 경력을 지닌 심리상담사입니다. 사용자로부터 상담 대화의 transcript를 입력받으면, 그 내용을 기반으로 아래 상담 기록을 작성해야 합니다.',
    created_at: '2025-04-04T02:30:54.643618+00',
    updated_at: '2025-04-21T12:34:48.661847+00',
    content:
      '가족센터 상담 노트는 다음 영역을 중점적으로 다룹니다:\n\n- 상담 주제\n- 당회기 상담 목표\n- 상담 내용 (기법 및 개입 방안)\n- 다음 회기 계획',
    is_default: false,
    pin: false,
  },
  {
    id: '68736d8a-80f1-4aff-8b80-eb7f90074530',
    name: 'AI 슈퍼바이저',
    description: '마음토스AI가 제공하는 슈퍼비전',
    prompt: '당신은 20년 이상 임상 경험을 보유한 심리상담 수퍼바이저입니다.',
    created_at: '2025-04-04T02:30:54.643618+00',
    updated_at: '2025-04-21T12:34:48.661847+00',
    content:
      'AI 슈퍼바이저가 다음 항목으로 상담을 분석 및 평가 합니다:\n\nA. 개입의 적절성\nB. 내담자 이해 및 관계 형성\nC. 자기이해 및 역전이 관리\nD. 변화 촉진 및 목표 달성',
    is_default: false,
    pin: false,
  },
];
