import type { AccordionItem } from '@/components/ui/composites/Accordion';

export const marketingTermsItems: AccordionItem[] = [
  {
    value: '1',
    header: '제1조 (수집 및 이용 목적)',
    content: (
      <div className="space-y-3">
        <p>
          회사는 수집한 개인정보를 다음의 마케팅 및 프로모션 목적으로
          이용합니다.
        </p>
        <div className="ml-4 space-y-2">
          <div>
            <p className="font-semibold">서비스 관련 최신 정보 안내</p>
            <p className="ml-4">
              - 신규 기능 업데이트, 상담 슈퍼비전 가이드, 뉴스레터 발송
            </p>
          </div>
          <div>
            <p className="font-semibold">혜택 및 이벤트</p>
            <p className="ml-4">
              - 할인 쿠폰 제공, 프로모션 안내, 경품 이벤트 진행, 무료 체험 기회
              제공
            </p>
          </div>
          <div>
            <p className="font-semibold">맞춤형 서비스</p>
            <p className="ml-4">
              - 서비스 이용 기록 분석을 통한 개인 맞춤형 혜택 추천 및 서비스
              개선을 위한 설문조사
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: '2',
    header: '제2조 (수집 및 이용 항목)',
    content: (
      <div className="space-y-3">
        <p>마케팅 활용을 위해 아래의 정보를 수집·이용합니다.</p>
        <div className="ml-4 space-y-2">
          <div>
            <p className="font-semibold">기본 정보</p>
            <p className="ml-4">- 이름, 이메일 주소, 휴대전화번호</p>
          </div>
          <div>
            <p className="font-semibold">서비스 이용 정보</p>
            <p className="ml-4">
              - 접속 로그, 쿠키, 서비스 이용 기록, 구매 및 결제 이력 (맞춤형
              혜택 제공 시 활용)
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: '3',
    header: '제3조 (보유 및 이용 기간)',
    content: (
      <div className="space-y-2">
        <div className="ml-4 space-y-1">
          <p>
            - 보유 기간: <strong>동의 철회 시 또는 회원 탈퇴 시까지</strong>
          </p>
          <p>
            - 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 정한
            기간 동안 보관합니다.
          </p>
        </div>
      </div>
    ),
  },
  {
    value: '4',
    header: '제4조 (전송 매체)',
    content: (
      <div className="space-y-3">
        <p>
          회사는 귀하가 동의한 연락처로 다음과 같은 매체를 통해 광고성 정보를
          전송할 수 있습니다.
        </p>
        <div className="ml-4 space-y-1">
          <p>- 전자우편 (E-mail / 뉴스레터)</p>
          <p>- 문자메시지 (SMS/LMS)</p>
          <p>- 앱 푸시 (App Push) 알림</p>
          <p>- 카카오톡 알림톡/친구톡</p>
        </div>
      </div>
    ),
  },
  {
    value: '5',
    header: '제5조 (동의 거부 권리 및 철회 방법)',
    content: (
      <div className="space-y-3">
        <div className="space-y-2">
          <p>
            귀하는 본 마케팅 정보 수신 동의를 거부할 권리가 있으며, 동의를
            거부하더라도 서비스의 필수적인 기능 이용에는 제한이 없습니다.
          </p>
          <p>
            동의 후에도 언제든지 아래의 방법으로 무료로 수신 동의를 철회(수신
            거부)할 수 있습니다.
          </p>
        </div>
        <div className="ml-4 space-y-1">
          <p>
            - <strong>이메일:</strong> 수신된 뉴스레터 하단의 [수신거부] 링크
            클릭
          </p>
          <p>
            - <strong>서비스 내 설정:</strong> [설정 {'>'} 알림 설정] 메뉴에서
            마케팅 정보 수신 해제
          </p>
          <p>
            - <strong>고객센터:</strong>{' '}
            <a
              href="mailto:privacy@mindfullabs.ai"
              className="text-primary-500 underline hover:text-primary-600"
            >
              privacy@mindfullabs.ai
            </a>{' '}
            로 철회 요청
          </p>
        </div>
      </div>
    ),
  },
];

export const serviceTermsItems: AccordionItem[] = [
  {
    value: 'chapter1',
    header: '제 1 장 총 칙',
    content: (
      <div className="space-y-4">
        <div>
          <p className="mb-1 font-semibold">제 1 조 (목적)</p>
          <p>
            본 약관은 마인드풀랩스 주식회사(이하 "회사"라 합니다)가 제공하는
            상담 관리 및 AI 분석 지원 서비스인 마음토스(Mindthos) 및 관련 제반
            서비스(이하 "서비스"라 합니다)를 이용함에 있어 회사와 회원 간의
            권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </div>
        <div>
          <p className="mb-1 font-semibold">제 2 조 (용어의 정의)</p>
          <div className="space-y-1">
            <p>
              1. "서비스"란 단말기(PC, 휴대형 단말기 등)에 상관없이 회원이
              이용할 수 있는 마음토스 및 관련 제반 서비스를 의미합니다.
            </p>
            <p>
              2. "회원"이란 본 약관에 따라 회사와 이용계약을 체결하고 회사가
              제공하는 서비스를 이용하는 고객을 말합니다.
            </p>
            <p>
              3. "크레딧(Credit)"이란 서비스를 이용하기 위해 사용되는 가상의
              데이터 단위를 의미하며, 회원은 이를 유상으로 구매하거나 회사의
              정책에 따라 무상으로 지급받을 수 있습니다.
            </p>
            <p>
              4. "상담 데이터"란 회원이 서비스를 이용하며 입력, 업로드하는 음성
              파일, 텍스트, 메모 등 일체의 정보를 의미합니다.
            </p>
            <p>
              5. "AI 분석 결과"란 상담 데이터를 바탕으로 회사의 알고리즘이
              생성한 축어록, 요약, 분석 리포트, 슈퍼비전 제안 등을 의미합니다.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-1 font-semibold">제 3 조 (약관의 게시와 개정)</p>
          <div className="space-y-1">
            <p>
              1. 회사는 본 약관의 내용을 회원이 쉽게 확인할 수 있도록 서비스
              초기 화면 또는 설정 메뉴에 게시합니다.
            </p>
            <p>
              2. 회사는 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및
              정보보호 등에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 본
              약관을 개정할 수 있습니다.
            </p>
            <p>
              3. 회사가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여
              현행약관과 함께 개정약관 적용일 7일 전부터 공지합니다. 단,
              회원에게 불리한 변경의 경우 30일 전부터 공지하고 이메일 등으로
              개별 통지합니다.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: 'chapter2',
    header: '제 2 장 서비스 이용 계약',
    content: (
      <div className="space-y-4">
        <div>
          <p className="mb-1 font-semibold">제 4 조 (이용계약 체결)</p>
          <div className="space-y-1">
            <p>
              1. 이용계약은 회원이 되고자 하는 자(이하 "가입신청자")가 약관의
              내용에 동의하고 가입을 신청한 후, 회사가 이를 승낙함으로써
              체결됩니다.
            </p>
            <p>
              2. 회사는 가입신청자가 만 14세 미만이거나, 타인의 정보를
              도용하거나, 허위 정보를 기재한 경우 승낙을 거부하거나 사후에
              이용계약을 해지할 수 있습니다.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-1 font-semibold">
            제 5 조 (개인정보보호 및 데이터 보안)
          </p>
          <div className="space-y-1">
            <p>
              1. 회사는 「개인정보보호법」 등 관계 법령이 정하는 바에 따라
              회원의 개인정보를 보호하기 위해 노력합니다.
            </p>
            <p>
              2. <strong>[데이터 학습 금지]</strong> 회사는 회원이 업로드한 상담
              데이터 및 생성된 결과물을 회원의 동의 없이 회사의 AI 모델 학습이나
              알고리즘 개선 목적으로 사용하지 않습니다.
            </p>
            <p>
              3. 회사는 상담 데이터 보호를 위해 업계 표준 이상의 암호화
              기술(AES-256 등)을 적용하며, 데이터에 대한 접근 통제를 엄격히
              수행합니다.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: 'chapter3',
    header: '제 3 장 서비스의 이용',
    content: (
      <div className="space-y-4">
        <div>
          <p className="mb-1 font-semibold">제 6 조 (서비스의 제공 및 변경)</p>
          <div className="space-y-1">
            <p>1. 회사는 다음과 같은 서비스를 제공합니다.</p>
            <p className="ml-4">① 음성 녹음 및 업로드 기능</p>
            <p className="ml-4">② STT(Speech-to-Text) 기반 축어록 생성</p>
            <p className="ml-4">③ AI 기반 상담 요약, 분석 및 슈퍼비전 제안</p>
            <p className="ml-4">④ 내담자 관리 및 상담 일정 관리 기능</p>
            <p>
              2. 회사는 기술적 사양의 변경이나 운영상의 필요에 따라 서비스의
              전부 또는 일부를 변경하거나 중단할 수 있습니다.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-1 font-semibold">
            제 7 조 (서비스 이용의 제한 및 면책)
          </p>
          <div className="space-y-1">
            <p>
              1. <strong>[의료 행위 아님]</strong> 본 서비스가 제공하는 분석
              결과 및 슈퍼비전 제안은 상담을 돕기 위한 보조 자료일 뿐이며,
              의학적 진단이나 확정적인 심리 평가를 대체할 수 없습니다. 최종적인
              임상적 판단과 책임은
              <strong> 회원(상담 전문가) </strong> 본인에게 있습니다.
            </p>
            <p>
              2. <strong>[AI 기술의 한계]</strong> AI 분석 결과는 기술적 특성상
              환각(Hallucination) 현상이나 부정확한 내용이 포함될 수 있습니다.
              회원은 반드시 원본 데이터와 대조하여 내용을 확인해야 하며, 회사는
              분석 결과의 완전성, 무결성을 보증하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: 'chapter4',
    header: '제 4 장 대금 결제 및 환불',
    content: (
      <div className="space-y-4">
        <div>
          <p className="mb-1 font-semibold">제 8 조 (크레딧 및 유료 서비스)</p>
          <div className="space-y-1">
            <p>
              1. 회사는 서비스를 이용할 수 있는 크레딧을 정기 구독 상품 또는
              단건 충전 상품 형태로 제공합니다.
            </p>
            <p>
              2. 크레딧의 차감 기준, 유효기간, 소멸 정책 등 상세 내용은 서비스
              내 별도 고지된 정책을 따릅니다.
            </p>
            <p>
              3. 회원이 유효기간이 다른 여러 종류의 크레딧을 보유한 경우, 회사가
              정한 우선순위에 따라 차감됩니다.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-1 font-semibold">제 9 조 (청약철회 및 환불)</p>
          <div className="space-y-1">
            <p>
              1. 회원은 유료 결제 후 7일 이내에 사용 내역이 없는 경우
              청약철회(전액 환불)를 할 수 있습니다.
            </p>
            <p>
              2. 크레딧 사용 후, 또는 정기 구독 서비스 이용 중 해지 시 환불 규정
              등 상세 내용은 서비스 내 별도 고지된 정책을 따릅니다.
            </p>
            <p>
              3. 환불 시 결제 수수료 등 부대 비용을 공제할 수 있으며, 애플
              앱스토어 등 제3자 마켓을 통한 결제는 해당 마켓의 환불 정책을
              따릅니다.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: 'chapter5',
    header: '제 5 장 계약 당사자의 의무',
    content: (
      <div className="space-y-4">
        <div>
          <p className="mb-1 font-semibold">제 10 조 (회원의 의무)</p>
          <div className="space-y-1">
            <p>
              1. 회원은 서비스를 이용하여 상담 내담자의 개인정보나 민감정보를
              처리함에 있어 의료법, 개인정보보호법 등 관련 법령을 준수해야 할
              책임이 있습니다.
            </p>
            <p>
              2. 회원은 본인의 계정 정보를 제3자와 공유해서는 안 되며, 계정
              공유로 인해 발생한 데이터 유출 등의 사고에 대해 회사는 책임을 지지
              않습니다.
            </p>
            <p>
              3. 회원은 서비스를 이용하여 불법적인 내용을 기록하거나 공서양속에
              반하는 행위를 해서는 안 됩니다.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-1 font-semibold">제 11 조 (회사의 의무)</p>
          <div className="space-y-1">
            <p>
              1. 회사는 관련 법령과 본 약관이 금지하는 행위를 하지 않으며,
              계속적이고 안정적으로 서비스를 제공하기 위해 최선을 다합니다.
            </p>
            <p>
              2. 회사는 서비스 이용과 관련하여 회원으로부터 제기된 의견이나
              불만이 정당하다고 인정할 경우에는 이를 처리해야 합니다.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: 'chapter6',
    header: '제 6 장 기타',
    content: (
      <div className="space-y-4">
        <div>
          <p className="mb-1 font-semibold">제 12 조 (손해배상 등)</p>
          <div className="space-y-1">
            <p>
              1. 회사가 무료로 제공하는 서비스 이용과 관련하여 회원에게 발생한
              손해에 대해서는 책임을 지지 않습니다.
            </p>
            <p>
              2. 회사의 귀책사유로 인해 유료 서비스 이용에 장애가 발생한 경우,
              회사는 회사가 정한 보상 정책에 따라 배상합니다. 단, 천재지변 등
              불가항력으로 인한 경우는 제외합니다.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-1 font-semibold">제 13 조 (재판권 및 준거법)</p>
          <div className="space-y-1">
            <p>
              본 약관과 관련하여 회사와 회원 간에 발생한 분쟁에 대해서는
              대한민국의 법률을 적용하며, 관할 법원은 민사소송법에 따릅니다.
            </p>
          </div>
        </div>
        <div className="border-t pt-2">
          <p className="font-semibold">부칙</p>
          <p>본 약관은 2025년 12월 22일부터 시행합니다.</p>
        </div>
      </div>
    ),
  },
];

export const privacyPolicyItems: AccordionItem[] = [
  {
    value: '1',
    header: '제1조 (개인정보의 처리 목적)',
    content: (
      <div className="space-y-3">
        <p>
          회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
          개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이
          변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는
          등 필요한 조치를 이행할 예정입니다.
        </p>
        <div className="ml-4 space-y-2">
          <div>
            <p className="font-semibold">1. 회원 가입 및 관리</p>
            <div className="ml-4 space-y-1">
              <p>
                - 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증,
                회원 자격 유지·관리, 서비스 부정 이용 방지, 각종 고지·통지, 고충
                처리, 분쟁 조정을 위한 기록 보존
              </p>
            </div>
          </div>
          <div>
            <p className="font-semibold">2. 서비스 제공 및 기능 운영</p>
            <div className="ml-4 space-y-1">
              <p>
                - 상담 데이터(음성, 텍스트)의 저장 및 분석, STT(음성-텍스트
                변환) 및 AI 기반 상담 분석 결과 제공, 내담자 및 상담 일정 관리
                기능 제공
              </p>
            </div>
          </div>
          <div>
            <p className="font-semibold">3. 서비스 개선 및 신규 서비스 개발</p>
            <div className="ml-4 space-y-1">
              <p>
                - 서비스 이용 기록 분석을 통한 품질 개선, 접속 빈도 파악,
                통계학적 분석
              </p>
            </div>
          </div>
          <div>
            <p className="font-semibold">4. 마케팅 및 광고 활용</p>
            <div className="ml-4 space-y-1">
              <p>
                - 신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성
                정보 제공 및 참여 기회 제공 (별도 동의 시)
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: '2',
    header: '제2조 (수집하는 개인정보 항목 및 수집 방법)',
    content: (
      <div className="space-y-3">
        <p>회사는 서비스 제공을 위해 최소한의 개인정보를 수집하고 있습니다.</p>
        <div className="ml-4 space-y-3">
          <div>
            <p className="font-semibold">1. 회원 가입 및 관리 (필수)</p>
            <div className="ml-4 space-y-1">
              <p>
                - 수집 항목: 이름, 이메일 주소, 비밀번호, 휴대전화번호, 소속
                기관/직위(선택)
              </p>
            </div>
          </div>
          <div>
            <p className="font-semibold">2. 서비스 이용 과정 (자동 수집)</p>
            <div className="ml-4 space-y-1">
              <p>
                - 수집 항목: IP 주소, 쿠키(Cookie), 접속 로그, 서비스 이용 기록,
                기기 정보(브라우저 및 OS 정보), 불량 이용 기록
              </p>
            </div>
          </div>
          <div>
            <p className="font-semibold">3. 유료 서비스 결제 시</p>
            <div className="ml-4 space-y-1">
              <p>
                - 수집 항목: 카드사명, 카드번호(일부), 생년월일(또는
                사업자번호), 결제 승인 내역
              </p>
              <p className="mt-1 italic">
                ※ 결제 상세 정보는 PG사(토스페이먼츠)가 직접 수집 및 저장하며,
                회사는 해당 정보를 직접 저장하지 않습니다.
              </p>
            </div>
          </div>
          <div>
            <p className="font-semibold">
              4. 상담 데이터 처리 (회원이 업로드 시)
            </p>
            <div className="ml-4 space-y-1">
              <p>
                - 수집 항목: 상담 녹음 파일(음성), 상담 노트(텍스트), 내담자
                식별 정보(이름, 별칭 등 회원이 입력한 정보)
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: '3',
    header: '제3조 (개인정보의 처리 및 보유 기간)',
    content: (
      <div className="space-y-3">
        <p>
          회사는 법령에 따른 개인정보 보유·이용 기간 또는 이용자로부터 동의받은
          기간 내에서 개인정보를 처리·보유합니다.
        </p>
        <div className="ml-4 space-y-3">
          <div>
            <p className="font-semibold">1. 회원 가입 정보</p>
            <div className="ml-4 space-y-1">
              <p>- 회원 탈퇴 시까지</p>
              <p>- 단, 부정이용 방지를 위해 탈퇴 후 30일간 보관 후 파기</p>
            </div>
          </div>
          <div>
            <p className="font-semibold">2. 서비스 이용 기록</p>
            <div className="ml-4 space-y-1">
              <p>- 회원 탈퇴 시까지</p>
            </div>
          </div>
          <div>
            <p className="font-semibold">3. 관련 법령에 의한 정보 보유 사유</p>
            <div className="ml-4 space-y-1">
              <p>- 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</p>
              <p>
                - 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)
              </p>
              <p>
                - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)
              </p>
              <p>- 웹사이트 접속 기록: 3개월 (통신비밀보호법)</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: '4',
    header: '제4조 (개인정보의 제3자 제공)',
    content: (
      <div className="space-y-2">
        <p>
          회사는 이용자의 동의 없이는 개인정보를 외부에 제공하지 않습니다. 단,
          다음의 경우에는 예외로 합니다.
        </p>
        <div className="ml-4 space-y-1">
          <p>1. 이용자가 사전에 동의한 경우</p>
          <p>
            2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와
            방법에 따라 수사기관의 요구가 있는 경우
          </p>
          <p>
            3. 통계 작성, 학술 연구 또는 시장 조사를 위하여 필요한 경우로서 특정
            개인을 식별할 수 없는 형태(가명 정보)로 가공하여 제공하는 경우
          </p>
        </div>
      </div>
    ),
  },
  {
    value: '5',
    header: '제5조 (개인정보 처리 위탁)',
    content: (
      <div className="space-y-3">
        <p>
          회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 외부
          전문 업체에 위탁하고 있습니다.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border px-3 py-2 text-left">수탁 업체</th>
                <th className="border px-3 py-2 text-left">위탁 업무 내용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2 font-medium">
                  Amazon Web Services (AWS)
                </td>
                <td className="border px-3 py-2">
                  데이터 보관 및 클라우드 서버 인프라 운영
                </td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-medium">Supabase</td>
                <td className="border px-3 py-2">
                  데이터베이스 관리 및 사용자 인증(Authentication) 처리
                </td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-medium">OpenAI</td>
                <td className="border px-3 py-2">
                  상담 데이터의 텍스트 분석 및 요약 생성 (API 연동)
                </td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-medium">Google Gemini</td>
                <td className="border px-3 py-2">
                  상담 데이터의 심층 분석 및 슈퍼비전 생성 (API 연동)
                </td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-medium">
                  (주)토스페이먼츠
                </td>
                <td className="border px-3 py-2">
                  유료 서비스 결제 처리 및 결제 도용 방지
                </td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-medium">
                  (주)스티비 (Stibee)
                </td>
                <td className="border px-3 py-2">
                  뉴스레터 발송 및 마케팅 이메일 서비스
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm italic">
          [국외 이전 안내] 서비스 제공을 위해 일부 데이터(AWS, OpenAI, Gemini
          등)는 해외(미국 등) 서버로 전송 및 보관될 수 있으며, 회사는 해당
          기업들과 엄격한 데이터 보호 계약을 체결하여 관리합니다.
        </p>
      </div>
    ),
  },
  {
    value: '6',
    header: '제6조 (개인정보의 파기)',
    content: (
      <div className="space-y-3">
        <div>
          <p className="font-semibold">1. 파기 절차</p>
          <p className="ml-4">
            이용 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함)
            내부 방침 및 기타 관련 법령에 따라 일정 기간 저장된 후 파기됩니다.
          </p>
        </div>
        <div>
          <p className="font-semibold">2. 파기 방법</p>
          <div className="ml-4 space-y-1">
            <p>
              - 전자적 파일 형태: 기록을 재생할 수 없는 기술적 방법(Low Level
              Format 등)을 사용하여 삭제
            </p>
            <p>- 종이 문서: 분쇄기로 분쇄하거나 소각</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: '7',
    header: '제7조 (이용자 및 법정대리인의 권리와 행사 방법)',
    content: (
      <div className="space-y-2">
        <div className="ml-4 space-y-1">
          <p>
            1. 이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며,
            회원 탈퇴(동의 철회)를 요청할 수 있습니다.
          </p>
          <p>
            2. 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여
            하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.
          </p>
          <p>
            3. 개인정보의 오류에 대한 정정을 요청하신 경우 정정을 완료하기
            전까지 당해 개인정보를 이용 또는 제공하지 않습니다.
          </p>
        </div>
      </div>
    ),
  },
  {
    value: '8',
    header: '제8조 (개인정보의 안전성 확보 조치)',
    content: (
      <div className="space-y-3">
        <p>
          회사는 「개인정보 보호법」 제29조에 따라 다음과 같이 안전성 확보에
          필요한 기술적, 관리적 및 물리적 조치를 하고 있습니다.
        </p>
        <div className="ml-4 space-y-2">
          <div>
            <p className="font-semibold">1. 관리적 조치</p>
            <p className="ml-4">
              - 내부관리계획 수립·시행, 정기적 직원 교육 등
            </p>
          </div>
          <div>
            <p className="font-semibold">2. 기술적 조치</p>
            <div className="ml-4 space-y-1">
              <p>
                - <strong>데이터 암호화:</strong> 비밀번호, 고유식별정보, 상담
                데이터 파일 등 중요 정보는 <strong>AES-256</strong> 등 강력한
                알고리즘으로 암호화하여 저장합니다.
              </p>
              <p>
                - <strong>학습 금지 조치:</strong> 회원이 업로드한 상담 데이터는
                <strong>
                  AI 모델의 재학습(Training)에 사용되지 않도록
                </strong>{' '}
                기술적/계약적 보호 조치를 적용합니다.
              </p>
              <p>
                - <strong>해킹 대비:</strong> 해킹이나 컴퓨터 바이러스 등에 의한
                개인정보 유출을 막기 위해 보안 프로그램을 설치하고 주기적으로
                갱신·점검합니다.
              </p>
            </div>
          </div>
          <div>
            <p className="font-semibold">3. 물리적 조치</p>
            <p className="ml-4">- 전산실, 자료보관실 등의 접근 통제</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: '9',
    header: '제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)',
    content: (
      <div className="space-y-3">
        <div className="ml-4 space-y-1">
          <p>
            1. 회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용
            정보를 저장하고 수시로 불러오는 ‘쿠키(cookie)’를 사용합니다.
          </p>
          <p>
            2. 이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹 브라우저
            설정을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할
            경우 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.
          </p>
        </div>
      </div>
    ),
  },
  {
    value: '10',
    header: '제10조 (개인정보 보호책임자)',
    content: (
      <div className="space-y-3">
        <p>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
          관련한 정보주체의 불만 처리 및 피해 구제 등을 위하여 아래와 같이
          개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <div className="ml-4 space-y-2">
          <div>
            <p className="font-semibold">개인정보 보호책임자</p>
            <div className="ml-4 space-y-1">
              <p>- 성명: 강호남</p>
              <p>- 직책: CPO (Chief Privacy Officer)</p>
              <p>
                - 이메일: <strong>privacy@mindfullabs.ai</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: '11',
    header: '제11조 (권익 침해 구제 방법)',
    content: (
      <div className="space-y-3">
        <p>
          정보주체는 아래의 기관에 대해 개인정보 침해에 대한 피해 구제, 상담
          등을 문의하실 수 있습니다.
        </p>
        <div className="ml-4 space-y-1">
          <p>- 개인정보침해신고센터 (privacy.kisa.or.kr / 국번 없이 118)</p>
          <p>- 개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)</p>
          <p>- 대검찰청 사이버수사과 (www.spo.go.kr / 국번 없이 1301)</p>
          <p>- 경찰청 사이버수사국 (ecrm.cyber.go.kr / 국번 없이 182)</p>
        </div>
      </div>
    ),
  },
  {
    value: '12',
    header: '제12조 (개인정보 처리방침 변경)',
    content: (
      <div className="space-y-2">
        <p>
          본 개인정보 처리방침은 <strong>2025년 12월 22일</strong>부터
          적용됩니다.
        </p>
      </div>
    ),
  },
];
