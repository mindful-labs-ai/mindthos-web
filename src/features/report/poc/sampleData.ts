import type { GenogramReport } from '../types/reportSchema';

/** 짧은 버전 - 1~2페이지 */
export const shortReport: GenogramReport = {
  meta: {
    title: '체계론적 가족역동 사정 및 평가 임상 개입 보고서',
    clientName: '이영숙',
    counselorName: '김성곤',
    createdAt: '2026년 2월 23일',
  },
  sections: [
    {
      type: 'cover',
      clientName: '이영숙',
      createdAt: '2026년 2월 23일',
      organization: '마음토스 상담센터',
      counselorName: '김성곤',
    },
    {
      type: 'info_table',
      title: '내담자 정보',
      rows: [
        {
          left: { key: '내담자', value: '이영숙(여)' },
          right: {
            key: '상담 일자',
            value: '2025년 11월 13일 ~ 2026년 2월 20일',
          },
        },
        {
          left: {
            key: '연령 / 직업',
            value: '58세 / 전업주부 (전직 중등 국어 교사)',
          },
          right: {
            key: '분석 도구',
            value: 'Genogram Interview, Family Chronology',
          },
        },
        {
          left: { key: '가족 형태', value: '핵가족 (부부 동거, 자녀 독립)' },
          right: { key: '상담 기관', value: '마음토스 심리상담센터' },
        },
        {
          left: {
            key: '주 호소',
            value:
              '중증 우울 및 허무감, 부부 갈등 및 남편의 통제, 자살 사고(SI), 심각한 고립감, 금전적 압박 및 불안',
          },
          right: { key: '상담사', value: '김성곤' },
        },
      ],
    },
    { type: 'heading', level: 1, text: '전반적인 가족 역동 및 종합 소견' },
    { type: 'divider' },
    { type: 'sub_heading', text: '가족 적응도 프로파일' },
    {
      type: 'profile_select',
      title: '가족 응집력',
      options: ['매우 밀착', '불균형', '연결됨', '해석 불가'],
      selectedIndex: 1,
      description:
        'IP는 원가족(특히 친정어머니, 오빠) 및 딸 지혜와는 지나치게 밀착(부모화)되어 있는 반면, 남편과 아들에게는 철저히 정서적으로 단절/소외된 불균형 구조임',
    },
    {
      type: 'profile_select',
      title: '가족 경계선',
      options: ['산만', '명료', '경직', '해석 불가'],
      selectedIndex: 2,
      description:
        '가부장적이고 통제적인 남편 및 시댁 문화와 내담자의 자아가 극심하게 충돌하며 타협의 여지가 없는 경직된 상태임',
    },
    {
      type: 'profile_select',
      title: '의사소통',
      options: ['비난형', '회유형', '산만형', '초이성형', '일치형'],
      selectedIndex: 1,
      description:
        '남편은 지속적으로 비난형 의사소통을 사용하며, IP는 극도의 두려움 속에 침묵하고 억압하는 회유형/순응형 패턴을 보임',
    },
    {
      type: 'profile_select',
      title: '스트레스 대처',
      options: ['문제해결 중심', '정서 중심', '해석 불가'],
      selectedIndex: 1,
      description:
        '부당한 통제와 압박 상황에서 문제 제기보다는 자살 사고로의 도피, 딸에 대한 하소연, 오빠에게 돈을 주어 불안을 일시적으로 무마하는 정서 중심적 대처를 함',
    },
    { type: 'sub_heading', text: '주요 임상적 소견 요약' },
    {
      type: 'letter_box',
      entries: [
        {
          subtitle: '관계 역동 및 정서 패턴',
          contents: [
            '정서적 단절: 37년의 결혼 생활 동안 부부간 정서적 교류가 차단되었고, 남편-아들 중심의 남성 연대에서 철저히 소외됨.',
            '삼각관계: 부부 갈등의 억압된 긴장을 [딸 지혜]에게 하소연하며 해소하거나, 남편 몰래 [친정 오빠]의 무리한 금전 요구를 들어주며 긴장을 유발하는 삼각관계 형성.',
            '이중 구속: 가족을 위해 희생하고 직업을 포기할 것을 강요받았으나, 현재는 경제력이 없다며 "집에서 놀고먹었다"고 멸시당하는 모순적 메시지에 갇힘.',
          ],
        },
        {
          subtitle: '가족생활주기 및 스트레스',
          contents: [
            '전환기 위기: 남편의 은퇴로 인한 24시간 밀착 동거(통제 증가)와 유일한 지지자였던 딸의 결혼 및 임신으로 극심한 유기 불안과 고립감(빈 둥지 증후군) 촉발.',
            '미해결된 트라우마: 1993년 남편과 시어머니의 강압으로 인한 교사직 강제 사퇴(사회적 자아의 상실), 그리고 친정어머니의 불행을 지켜보며 감정 쓰레기통 역할을 했던 부모화(Parentification) 트라우마.',
            '만성적 돌봄 부담: 어린 시절 친정어머니와 오빠의 사고 수습에 이어, 현재도 남편의 가사/감정 통제를 받아내고 오빠의 금전 요구를 남편 몰래 방어해야 하는 만성적 압박 상태',
          ],
        },
        {
          subtitle: '종합 소견 요약',
          contents: [
            '내담자는 과거 강압에 의한 직업 상실과 수십 년간 누적된 가부장적 폭력(시댁, 남편)으로 인해 자아존중감이 완전히 붕괴된 상태임. 유일한 심리적 안전기지였던 딸의 독립으로 인해 지지 체계가 무너지며 중증 우울 및 베란다 투신 등의 자살 사고(SI)가 심화됨. 자신이 친정어머니의 불행한 전철을 밟으며 딸에게 "부모화"의 짐을 대물림했다는 깊은 죄책감과, 남편 몰래 친정 오빠에게 돈을 주고 있다는 비밀이 극심한 불안(시한폭탄)을 야기하고 있음',
          ],
        },
      ],
    },

    { type: 'page_break' },

    {
      type: 'heading',
      level: 1,
      text: '가족 구조 및 사회문화적 배경',
    },
    { type: 'divider' },
    { type: 'sub_heading', text: '다세대 가계도 및 세대간 연결' },
    {
      type: 'genogram_image',
      caption: '내담자 가계도 (3세대)',
    },
    {
      type: 'letter_box',
      title: '구조적 및 배경적 특징',
      entries: [
        {
          subtitle: '가구 구성',
          contents: [
            '물리적: 부부 2인 동거 가구 (은퇴한 남편과 종일 밀착 생활)',
            '심리적: 내담자의 에너지는 독립한 딸에게 과도하게 의존되어 있으며, 동시에 경제적/정서적으로 착취하는 친정 오빠의 요구에 매여 있음.',
          ],
        },
        {
          subtitle: '사회문화적 배경',
          contents: [
            '가치관 충돌: "여자는 집안일과 희생이 우선"이라는 강박적인 가부장적 유교 이데올로기(친정아버지, 시어머니, 남편)가 내담자의 주체성과 자아실현(교사) 욕구를 철저히 억압하고 파괴함.',
            '"부모화"의 세대 간 전수: 억압된 가정 내에서 무기력한 어머니를 위로하며 감정적 방패막이 역할을 했던 내담자가, 무의식적으로 자신의 딸에게도 동일하게 배우자 험담과 하소연을 쏟아내는 역기능적 패턴을 대물림함',
          ],
        },
      ],
    },
    {
      type: 'letter_box',
      entries: [
        {
          subtitle: '설명',
          contents: [
            '현재 IP는 은퇴한 대기업 임원 출신의 남편과 거주 중이다. 두 자녀(아들, 딸)는 모두 독립했으나, 아들은 남편의 성향을 닮아 IP를 소외시키고, 의존 대상이던 딸마저 결혼하여 IP의 정서적 고립이 극에 달해 있다. 원가족과 시가의 공통된 가부장적 억압 아래 IP는 항상 "희생양"이자 "을"로 위치 지어졌다. 남편은 과거 모친과 극도로 밀착된 상태에서 아내를 식모 취급하였으며, 퇴직 후에는 통제벽이 더욱 심해졌다. IP는 무력감 속에서 친정 오빠의 금전 요구까지 남편 몰래 수용하며, 과거 친정어머니가 겪었던 공포와 불안의 패턴을 고스란히 반복하고 있다',
          ],
        },
      ],
    },

    { type: 'page_break' },

    { type: 'heading', level: 1, text: '가족생활 주기 및 연대기' },
    { type: 'divider' },
    { type: 'sub_heading', text: '주요 생애 사건 및 트라우마' },
    {
      type: 'timeline',
      title: '가족 연표 및 주요 스트레스 사건',
      events: [
        {
          year: '1985',
          descriptions: [
            '중등 국어 교사 임용 (내담자의 자부심 정점)',
            '박진호와 결혼, 시어머니와의 합가 및',
            '혹독한 시집살이 시작',
          ],
        },
        {
          year: '1993',
          descriptions: [
            '시어머니 병환 및 남편의',
            '강압적 협박(사표 안 쓰면 이혼)으로',
            '둘째 임신 중 교사직 강제 사퇴',
          ],
        },
        {
          year: '2015',
          descriptions: [
            '남편 은퇴. 24시간 밀착 생활로 인해',
            '갈등과 남편의 감시/통제가 극에 달함',
          ],
        },
        {
          year: '2022',
          descriptions: [
            '친정어머니 치매 판정 및 요양원 입소',
            '딸 지혜의 결혼 및 임신. 유일한 지지 체계 붕괴로',
            '우울증 및 자살 사고 심화',
          ],
        },
      ],
      notes: [
        "결정적 사건: 1993년 부당한 압력에 의한 교사직 사퇴 사건. 이는 단순한 퇴직이 아니라 주체적 자아인 '이영숙'의 장례식이자, 내담자가 완전한 무력감(학습된 무기력)에 빠지게 된 핵심 상실 경험임",
        "트라우마의 재연: 친정어머니의 치매 및 요양원 입소를 목격하며 자신의 처지와 동일시하는 공포를 느끼고, 오빠의 사고를 자신이 두려움 속에 수습하는 원가족 내의 '기능적 불균형' 패턴이 50년 넘게 동일하게 재연됨",
      ],
    },
    { type: 'sub_heading', text: '생활주기 및 적응도' },
    {
      type: 'stage_adaptation',
      stage: '독립기',
      adaptationLevel: 2,
      analysis:
        ' 평생의 지지자(딸)가 새로운 가정을 꾸려 떠나고, 자신을 학대하는 통제적 남편과 둘만 남겨진 노년기 전환 과정에 극도로 적응하지 못하며 심각한 생의 의미 상실(자살 충동)을 호소함',
    },
    { type: 'page_break' },
    { type: 'heading', level: 1, text: '관계 패턴 및 정서적 역동 분석' },
    { type: 'divider' },
    { type: 'sub_heading', text: '관계 패턴 및 삼각관계' },
    {
      type: 'relation_pattern',
      caption: '주요 갈등 및 삼각관계 도식',
      entries: [
        {
          subtitle: '부부 관계 [통제-복종 및 단절]',
          contents: [
            '남편은 일방적으로 간섭, 지적, 폭언을 쏟아내고 내담자는 극도의 공포와 무기력 속에서 분노를 억압한 채 침묵/순응하는 철저한 수직 관계임',
          ],
        },
        {
          subtitle: '삼각관계 [활성화]',
          contents: [
            '부부 관계의 스트레스를 해소하기 위해 [딸 지혜]와 밀착하여 남편을 흉보며 하소연하거나, 남편의 비난을 피하기 위해 남편 몰래 [친정 오빠]에게 금전을 지급하며 가족 내 위기를 임시방편으로 모면하려는 삼각관계가 강하게 작동함',
          ],
        },
        {
          subtitle: '세대간 전수',
          contents: [
            '가장 핵심적인 역동은 "부모화(Parentification)와 피해자 역할의 대물림"임. IP는 어린 시절 가부장적인 아버지의 폭력 속에서 무기력하게 울던 친정어머니의 감정 쓰레기통 역할을 했음. IP는 어머니의 삶을 혐오하며 다르게 살고자 발버둥 쳤으나, 결국 통제적인 남편을 만나 어머니와 동일한 무기력한 피해자의 위치에 놓였으며, 자신이 겪었던 부모화의 짐을 자신의 딸에게 고스란히 전수함. 또한 남편 쪽 원가족의 억압적이고 통제적인 남성 권위주의 역시 남편을 거쳐 아들에게 그대로 전수됨',
          ],
        },
      ],
      graphData: `{
  "id": "genogram-1770889746611-0v2u1q2",
  "view": {
    "viewPoint": {
      "zoom": 0.7714285714285715,
      "center": {
        "x": 145,
        "y": 344.2142857142857
      }
    },
    "visibility": {
      "age": true,
      "grid": true,
      "memo": true,
      "name": true,
      "illness": true,
      "birthDate": true,
      "deathDate": true,
      "extraInfo": true,
      "groupLine": true,
      "relationLine": true
    }
  },
  "version": "v1",
  "metadata": {
    "title": "AI 생성 가계도",
    "createdAt": "2026-02-12T09:49:06.611Z",
    "updatedAt": "2026-02-25T08:37:20.901Z"
  },
  "subjects": [
    {
      "id": "person-26022517370016-31e5758",
      "entity": {
        "memo": null,
        "type": "PERSON",
        "attribute": {
          "age": null,
          "isIP": false,
          "name": null,
          "gender": "Male",
          "isDead": false,
          "illness": "None",
          "lifeSpan": {
            "birth": null,
            "death": null
          },
          "extraInfo": {
            "job": null,
            "enable": false,
            "region": null,
            "education": null,
            "shortNote": null
          }
        }
      },
      "layout": {
        "style": {
          "size": "DEFAULT",
          "bgColor": "#FFFFFF",
          "textColor": "#3C3C3C"
        },
        "center": {
          "x": 225,
          "y": 375
        }
      }
    },
    {
      "id": "person-26022517370016-3a62a0e",
      "entity": {
        "memo": null,
        "type": "PERSON",
        "attribute": {
          "age": null,
          "isIP": false,
          "name": null,
          "gender": "Female",
          "isDead": false,
          "illness": "None",
          "lifeSpan": {
            "birth": null,
            "death": null
          },
          "extraInfo": {
            "job": null,
            "enable": false,
            "region": null,
            "education": null,
            "shortNote": null
          }
        }
      },
      "layout": {
        "style": {
          "size": "DEFAULT",
          "bgColor": "#FFFFFF",
          "textColor": "#3C3C3C"
        },
        "center": {
          "x": 405,
          "y": 375
        }
      }
    },
    {
      "id": "person-26022517370016-9514d0d",
      "entity": {
        "memo": null,
        "type": "PERSON",
        "attribute": {
          "age": null,
          "isIP": false,
          "name": null,
          "gender": "Male",
          "isDead": false,
          "illness": "None",
          "lifeSpan": {
            "birth": null,
            "death": null
          },
          "extraInfo": {
            "job": null,
            "enable": false,
            "region": null,
            "education": null,
            "shortNote": null
          }
        }
      },
      "layout": {
        "style": {
          "size": "DEFAULT",
          "bgColor": "#FFFFFF",
          "textColor": "#3C3C3C"
        },
        "center": {
          "x": 315,
          "y": 525
        }
      }
    },
    {
      "id": "person-26022517370477-d006c7a",
      "entity": {
        "memo": null,
        "type": "PERSON",
        "attribute": {
          "age": null,
          "isIP": false,
          "name": null,
          "gender": "Female",
          "isDead": false,
          "illness": "None",
          "lifeSpan": {
            "birth": null,
            "death": null
          },
          "extraInfo": {
            "job": null,
            "enable": false,
            "region": null,
            "education": null,
            "shortNote": null
          }
        }
      },
      "layout": {
        "style": {
          "size": "DEFAULT",
          "bgColor": "#FFFFFF",
          "textColor": "#3C3C3C"
        },
        "center": {
          "x": 555,
          "y": 495
        }
      }
    },
    {
      "id": "animal-26022517370893-2f3a1c1",
      "entity": {
        "memo": null,
        "type": "ANIMAL",
        "attribute": {
          "name": null,
          "isDead": false
        }
      },
      "layout": {
        "style": {
          "size": "DEFAULT",
          "bgColor": "#FFFFFF",
          "textColor": "#3C3C3C"
        },
        "center": {
          "x": 225,
          "y": 525
        }
      }
    }
  ],
  "annotations": [],
  "connections": [
    {
      "id": "partner-26022517370016-8de7c8f",
      "entity": {
        "memo": null,
        "type": "Partner_Line",
        "attribute": {
          "detail": {
            "marriedDate": null,
            "divorcedDate": null,
            "reunitedDate": null,
            "relationshipStartDate": null
          },
          "status": "Marriage",
          "subjects": [
            "person-26022517370016-31e5758",
            "person-26022517370016-3a62a0e"
          ]
        }
      },
      "layout": {
        "textColor": "#3C3C3C",
        "strokeColor": "#3C3C3C",
        "strokeWidth": "DEFAULT"
      }
    },
    {
      "id": "parentchild-26022517370016-4b45fed",
      "entity": {
        "memo": null,
        "type": "Children_Parents_Line",
        "attribute": {
          "status": "Biological_Child",
          "childRef": "person-26022517370016-9514d0d",
          "parentRef": "partner-26022517370016-8de7c8f"
        }
      },
      "layout": {
        "textColor": "#3C3C3C",
        "strokeColor": "#3C3C3C",
        "strokeWidth": "DEFAULT"
      }
    },
    {
      "id": "relation-26022517371203-0a13922",
      "entity": {
        "memo": null,
        "type": "Relation_Line",
        "attribute": {
          "status": "Fused",
          "subjects": [
            "animal-26022517370893-2f3a1c1",
            "person-26022517370016-9514d0d"
          ]
        }
      },
      "layout": {
        "textColor": "#3C3C3C",
        "strokeColor": "#3C3C3C",
        "strokeWidth": "DEFAULT"
      }
    },
    {
      "id": "relation-26022517371490-ec313dd",
      "entity": {
        "memo": null,
        "type": "Relation_Line",
        "attribute": {
          "status": "Fused",
          "subjects": [
            "person-26022517370477-d006c7a",
            "person-26022517370016-3a62a0e"
          ]
        }
      },
      "layout": {
        "textColor": "#3C3C3C",
        "strokeColor": "#3C3C3C",
        "strokeWidth": "DEFAULT"
      }
    },
    {
      "id": "influence-26022517372090-0f68983",
      "entity": {
        "memo": null,
        "type": "Influence_Line",
        "attribute": {
          "endRef": "person-26022517370016-9514d0d",
          "status": "Sexual_Abuse",
          "startRef": "person-26022517370477-d006c7a"
        }
      },
      "layout": {
        "textColor": "#3C3C3C",
        "strokeColor": "#3C3C3C",
        "strokeWidth": "DEFAULT"
      }
    }
  ]
}`,
    },
    { type: 'sub_heading', text: '가족 내 기능적 역할' },
    {
      type: 'letter_box',
      entries: [
        {
          subtitle: '설명',
          contents: [
            'IP (내담자): [희생양 / 부모화된 자녀] - 자신의 욕구는 배제한 채 친정어머니, 딸, 오빠, 남편의 감정과 뒷수습을 전담하는 감정 쓰레기통 및 희생자 역할에 고착됨.',
            '배우자 (남편): [통제자 / 과대기능자] - 경제적 우위를 무기로 가족 구성원을 통제하며, 타인의 고통에 공감하지 못하고 지시와 억압만 행사하는 독재자 역할. 자신의 모친과는 과도하게 융합되어 있었음',
          ],
        },
      ],
    },
    { type: 'page_break' },
    { type: 'heading', level: 1, text: '임상적 개입 및 제언' },
    { type: 'divider' },
    { type: 'sub_heading', text: '치료적 개입 전략' },
    {
      type: 'letter_box',
      entries: [
        {
          subtitle: '문제의 재정의',
          contents: [
            '내담자의 극심한 우울과 무기력을 "나약함"이 아닌, 부당하게 빼앗긴 자아에 대한 "지독한 애도"의 과정이자 억눌린 분노의 자연스러운 결과로 재정의함. 또한, 딸에게 의존했던 행위가 악의적인 것이 아니라 살아남기 위해 대물림된 생존 방식이었음을 일깨워 죄책감을 완화함',
          ],
        },
        {
          subtitle: '탈삼각화 및 경계 설정',
          contents: [
            '내담자가 딸과의 밀착된 경계를 인식하고, 임신한 딸을 보호하기 위해 스스로 정서적 독립을 꾀하도록 돕는다. 오빠의 위협적인 금전 요구는 내담자의 불안을 볼모로 한 착취임을 인식시키고, "거절"을 통한 명확한 외부 경계 설정과 단절 연습을 실시함',
          ],
        },
      ],
    },
    { type: 'sub_heading', text: '내담자 실행 과제' },
    {
      type: 'letter_box',
      entries: [
        {
          subtitle: '관계 실험 및 행동 과제',
          contents: [
            '내면의 말(Self-talk) 훈련: 남편의 통제와 비난 시 주눅 들지 않고, 속으로 "저건 내 얘기가 아니라 당신의 불안이다", "나는 최선을 다해 살았다"고 되뇌며 자아를 방어하는 인지적 분리 연습 수행',
            '단호한 거절 행동: 친정 오빠의 전화 수신을 차단하고, 무리한 금전 요구에 "나도 살아야겠다"고 명확히 거절 후 연락을 끊는 행동 과제 실천',
          ],
        },
        {
          subtitle: '치유적 의식 및 작별',
          contents: [
            '1993년에 상실했던 교사로서의 정체성, "35살의 이영숙"이 겪었던 억울함에 대해 충분히 애도하고 슬퍼할 수 있는 공간을 제공함. 매일 수면 전 "나는 친정 엄마의 보호자나 오빠의 구원자가 아닌, 그저 이영숙이다"라는 선언을 통해 과거의 짐과 작별하는 의식을 가짐. 더불어, 극단적 충동 시 행동으로 옮기지 않겠다는 안전 계약(Safety Plan)을 지속적으로 점검함',
          ],
        },
      ],
    },
    { type: 'sub_heading', text: '예후 및 향후 방향' },
    {
      type: 'letter_box',
      entries: [
        {
          subtitle: '',
          contents: [
            '현재 내담자가 과거의 수동적 공포에서 벗어나 억눌렸던 "분노"를 스스로 인지하기 시작한 점은 매우 고무적이다. 또한 오빠에 대한 단호한 거절 연습(Role Play)에 자발적으로 참여하며 경계를 긋는 시도를 하고 있다. 향후 상담은 안전 계약 기반 하에 수면 관리 및 우울증 약물 치료를 병행하도록 지원하며, 부부 관계의 극적인 개선보다는 내담자 본인의 개별화(Individuation) 작업과 "이영숙"이라는 이름의 온전한 정체성 및 자존감 회복에 초점을 맞출 예정이다',
          ],
        },
      ],
    },
  ],
};

/** 긴 버전 - 3~4페이지 (오버플로우 검증용) */
export const longReport: GenogramReport = {
  meta: {
    title: '체계론적 가족역동 사정 및 평가 임상 개입 보고서',
    clientName: '박OO',
    counselorName: '최상담',
    createdAt: '2026년 2월 23일',
  },
  sections: [
    {
      type: 'cover',
      clientName: '박OO',
      createdAt: '2026년 2월 23일',
      organization: '마음토스 상담센터',
      counselorName: '최상담',
    },

    {
      type: 'heading',
      level: 1,
      text: '내담자 기본 정보',
    },
    {
      type: 'info_table',
      title: '내담자 정보',
      rows: [
        {
          left: { key: '내담자', value: '박OO(남)' },
          right: { key: '상담 일자', value: '2025년 6월 ~ 현재' },
        },
        {
          left: { key: '연령 / 직업', value: '42세 / 회사원' },
          right: {
            key: '분석 도구',
            value: 'Genogram Interview, Family Chronology',
          },
        },
        {
          left: { key: '가족 형태', value: '핵가족 (부부 + 자녀 2명)' },
          right: { key: '상담 기관', value: '마음토스 상담센터' },
        },
        {
          left: { key: '주 호소', value: '부부 갈등, 원가족 문제' },
          right: { key: '상담사', value: '최상담' },
        },
      ],
    },
    {
      type: 'profile_select',
      title: '가족 응집력',
      options: ['매우 밀착', '불균형', '연결됨', '해석 불가'],
      selectedIndex: 1,
      description:
        'IP는 원가족(특히 친정어머니, 오빠) 및 딸 지혜와는 지나치게 밀착(부모화)되어 있는 반면, 남편과 아들에게는 철저히 정서적으로 단절/소외된 불균형 구조임',
    },
    { type: 'divider' },
    {
      type: 'heading',
      level: 1,
      text: '가계도 분석',
    },
    {
      type: 'genogram_image',
      imageData: 'https://via.placeholder.com/500x350?text=Genogram+Image',
      caption: '내담자 가계도 (3세대)',
    },
    {
      type: 'heading',
      level: 2,
      text: '2-1. 원가족 분석',
    },
    {
      type: 'paragraph',
      content:
        '내담자(박OO, 42세, 남)는 3남 중 장남으로, 부친(박△△, 70세)과 모친(김△△, 68세) 사이에서 출생하였습니다. 부친은 군인 출신으로 권위적인 양육 태도를 보였으며, 가정 내에서 감정 표현을 억제하는 문화가 형성되었습니다. 모친은 전통적인 가정주부로서 부친의 권위에 순응하면서도 자녀들에 대한 정서적 지지를 제공하는 역할을 수행했습니다.\n\n내담자는 장남으로서 가족 내 기대와 책임을 과도하게 부여받았으며, 이로 인해 어린 시절부터 성취 지향적 태도와 자기 희생적 패턴이 형성되었습니다. 차남(박□□, 39세)과는 경쟁적이면서도 보호적인 관계를 유지하고 있으며, 삼남(박○○, 35세)과는 정서적 거리감이 있습니다.\n\n부모의 관계는 외형적으로 안정적이었으나, 내담자의 회상에 의하면 부모 간 냉전 기간이 잦았고, 갈등 상황에서 모친이 내담자에게 정서적 의지를 하는 삼각화(triangulation) 패턴이 관찰됩니다.',
    },
    {
      type: 'heading',
      level: 2,
      text: '2-2. 현재 가족 분석',
    },
    {
      type: 'paragraph',
      content:
        '내담자는 배우자(이△△, 39세)와 2015년에 결혼하였으며, 슬하에 장녀(박◇◇, 8세)와 차남(박◇◇, 5세)을 두고 있습니다. 배우자는 교사로 재직 중이며, 비교적 자기 주장이 명확하고 독립적인 성격을 가지고 있습니다.\n\n부부 갈등의 핵심 주제는 가사 분담, 양육 방식의 차이, 그리고 원가족과의 경계 설정 문제입니다. 내담자는 원가족에 대한 강한 의무감을 느끼고 있어 배우자와의 사이에서 충성심 갈등(loyalty conflict)을 경험하고 있습니다.',
    },
    {
      type: 'heading',
      level: 2,
      text: '2-3. 세대 간 전이 패턴',
    },
    {
      type: 'bullet_list',
      title: '주요 세대 간 전이 패턴',
      items: [
        '감정 억제 패턴: 부친 → 내담자로 전이. 가정 내 감정 표현 어려움이 세대를 넘어 반복됨',
        '삼각화 패턴: 부모 갈등 시 내담자 개입 → 현재 부부 갈등 시 자녀(장녀) 개입 가능성 주시 필요',
        '장남 역할 과부하: 조부 세대에서도 장남에 대한 과도한 기대가 존재했으며, 이것이 부친 → 내담자로 이어짐',
        '갈등 회피 패턴: 모친의 갈등 회피 전략이 내담자에게도 학습되어 부부 관계에서 반복됨',
        '정서적 단절(emotional cutoff): 부친-조부 관계에서의 단절이 내담자-부친 관계에서도 부분적으로 관찰됨',
      ],
    },
    { type: 'divider' },
    {
      type: 'heading',
      level: 1,
      text: '가족 기능 평가',
    },
    {
      type: 'score_table',
      title: '원가족 기능 평가',
      columns: ['영역', '점수', '최대', '설명'],
      rows: [
        {
          label: '의사소통',
          score: 2,
          maxScore: 5,
          description: '감정 표현 억제, 기능적 소통 위주',
        },
        {
          label: '정서적 유대',
          score: 2,
          maxScore: 5,
          description: '선택적 유대, 부자 관계 단절 경향',
        },
        {
          label: '역할 분담',
          score: 3,
          maxScore: 5,
          description: '전통적 역할 구분, 장남 역할 과부하',
        },
        {
          label: '문제 해결',
          score: 2,
          maxScore: 5,
          description: '갈등 회피, 권위적 의사결정',
        },
        {
          label: '행동 통제',
          score: 4,
          maxScore: 5,
          description: '엄격한 규율, 융통성 부족',
        },
        {
          label: '정서적 반응',
          score: 1,
          maxScore: 5,
          description: '감정 억제 문화, 공감 부족',
        },
      ],
    },
    {
      type: 'score_table',
      title: '현재 가족 기능 평가',
      columns: ['영역', '점수', '최대', '설명'],
      rows: [
        {
          label: '의사소통',
          score: 3,
          maxScore: 5,
          description: '배우자 주도 소통, 내담자 수동적',
        },
        {
          label: '정서적 유대',
          score: 3,
          maxScore: 5,
          description: '자녀와 긍정적 유대, 부부간 거리감',
        },
        {
          label: '역할 분담',
          score: 3,
          maxScore: 5,
          description: '이중 소득 가정, 가사 분담 갈등',
        },
        {
          label: '문제 해결',
          score: 3,
          maxScore: 5,
          description: '갈등 회피 경향 있으나 개선 의지',
        },
        {
          label: '행동 통제',
          score: 4,
          maxScore: 5,
          description: '적절한 양육 기준, 일관성 유지 노력',
        },
        {
          label: '정서적 반응',
          score: 2,
          maxScore: 5,
          description: '배우자의 정서적 요구에 대한 반응 부족',
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'heading',
      level: 1,
      text: '상담 방향 제언',
    },
    {
      type: 'heading',
      level: 2,
      text: '4-1. 단기 목표',
    },
    {
      type: 'bullet_list',
      items: [
        '내담자의 감정 인식 및 표현 능력 향상 (감정 어휘 확장, 감정 일기 활용)',
        '부부 간 효과적인 의사소통 기술 습득 (비폭력대화, 적극적 경청)',
        '원가족과의 건강한 경계 설정 연습',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: '4-2. 장기 목표',
    },
    {
      type: 'bullet_list',
      items: [
        '세대 간 전이 패턴에 대한 통찰 심화',
        '자녀에게 건강한 감정 표현 모델링',
        '삼각화 패턴 인식 및 차단',
        '부부 관계에서의 정서적 친밀감 회복',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: '4-3. 종합 소견',
    },
    {
      type: 'paragraph',
      content:
        '내담자는 원가족에서 학습된 감정 억제 패턴과 장남 역할 과부하로 인해 현재 부부 관계에서 정서적 소통의 어려움을 겪고 있습니다. 그러나 문제를 인식하고 변화하고자 하는 강한 동기를 가지고 있어 상담 예후는 긍정적으로 판단됩니다.\n\n보웬(Bowen)의 세대 간 가족치료 관점에서 자기분화(differentiation of self) 수준 향상을 핵심 목표로 설정하고, 원가족과의 관계에서 정서적 반응성을 줄이면서도 연결을 유지하는 방법을 탐색하는 것이 효과적일 것입니다.\n\n또한 사티어(Satir) 모델의 의사소통 유형 분석을 활용하여 내담자의 초이성형(super-reasonable) 의사소통 패턴을 일치형(congruent)으로 전환하는 작업이 병행되면 부부 관계 개선에 실질적인 도움이 될 것으로 기대됩니다.',
    },
  ],
};
