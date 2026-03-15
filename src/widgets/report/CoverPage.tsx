/**
 * ============================================
 * 표지 페이지 (피그마 디자인 기반)
 * ============================================
 *
 * [커스텀 가이드]
 * - 모든 요소가 절대 위치(position: absolute)로 배치됨
 * - 위치 조정: 각 스타일의 top / left / right / bottom 값 수정
 * - 동적 변수: clientName, createdAt, organization, counselorName (4개만)
 * - 색상: theme.ts의 cover* 계열
 */

import { Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { CoverSection } from '@/features/report/types/reportSchema';

import { colors, fontFamily, fontSize } from './theme';

const s = StyleSheet.create({
  page: {
    fontFamily,
    backgroundColor: colors.coverBg,
    padding: 0,
    position: 'relative',
  },

  // ---- 배경 이미지 (flow 0 wrapper + absolute image) ----
  bgWrap: {
    width: 0,
    height: 0,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 595, // A4 width in pt
    height: 842, // A4 height in pt
    objectFit: 'cover',
  },

  // ---- 상단: CONFIDENTIAL (좌) ----
  confidential: {
    position: 'absolute',
    top: 34,
    left: 38,
    fontFamily: 'Jura',
    fontSize: fontSize.coverConfidential,
    fontWeight: 700,
    color: colors.coverConfidential,
    letterSpacing: 3,
  },

  // ---- 상단: 임상 분석 보고서 뱃지 (우) ----
  badge: {
    position: 'absolute',
    top: 27,
    left: 424,
    paddingHorizontal: 23,
    paddingVertical: 10,
    borderColor: colors.coverBadgeBorder,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    backgroundColor: colors.coverBadgeBg,
  },
  badgeText: {
    fontSize: fontSize.coverBadge,
    fontWeight: 800,
    color: colors.coverBadgeText,
  },

  // ---- 메인 제목 ----
  mainTitle: {
    position: 'absolute',
    top: 101,
    left: 38,
    fontFamily: 'BinggraeII',
    fontSize: fontSize.coverTitle,
    fontWeight: 700,
    color: colors.coverTitle,
    lineHeight: 1.4,
  },

  // ---- 영문 부제 ----
  engSubtitle: {
    position: 'absolute',
    top: 215,
    left: 38,
    fontFamily: 'OpenSans',
    fontSize: fontSize.coverSubtitle,
    color: colors.coverSubtitle,
    lineHeight: 2,
  },

  // ---- 정보 영역 (2x2 그리드) ----
  infoSection: {
    position: 'absolute',
    top: 588,
    left: 57,
    right: 57,
    borderTopWidth: 1,
    borderTopColor: colors.coverInfoDivider,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.coverInfoDivider,
  },
  infoCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  infoCellWithBorder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderLeftColor: colors.coverInfoDivider,
  },
  infoLabel: {
    fontSize: fontSize.coverInfoLabel,
    fontWeight: 800,
    color: colors.coverInfoLabel,
    marginRight: 8,
  },
  infoValue: {
    fontSize: fontSize.coverInfoValue,
    fontWeight: 400,
    color: colors.coverInfoValue,
  },

  // ---- 하단 안내 ----
  disclaimer: {
    position: 'absolute',
    top: 724,
    left: 126,
    fontSize: fontSize.coverDisclaimer,
    color: colors.coverDisclaimer,
    textAlign: 'center',
    lineHeight: 1.6,
  },

  // ---- 로고 ----
  logoImage: {
    position: 'absolute',
    top: 772,
    left: 38,
    width: 104,
    objectFit: 'contain',
  },
});

interface CoverPageProps {
  section: CoverSection;
}

export const CoverPage = ({ section }: CoverPageProps) => (
  <Page size="A4" style={s.page}>
    {/* 배경 이미지 (flow 0 + 맨 처음 선언 = z-index 최하위) */}
    <View style={s.bgWrap}>
      <Image src="/pdf/pdf_cover_bg_image.png" style={s.bgImage} />
    </View>

    {/* CONFIDENTIAL */}
    <Text style={s.confidential}>CONFIDENTIAL</Text>

    {/* 임상 분석 보고서 뱃지 */}
    <View style={s.badge}>
      <Text style={s.badgeText}>가계도 분석 보고서</Text>
    </View>

    {/* 메인 제목 */}
    <Text style={s.mainTitle}>가족체계 사정 및 평가{'\n'}임상 개입 보고서</Text>

    {/* 영문 부제 */}
    <Text style={s.engSubtitle}>
      Systems Theory Based Family Dynamics{'\n'}Assessment and Treatment Report
    </Text>

    {/* 정보 2x2 그리드 */}
    <View style={s.infoSection}>
      <View style={s.infoRow}>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>내담자</Text>
          <Text style={s.infoValue}>{section.clientName}</Text>
        </View>
        <View style={s.infoCellWithBorder}>
          <Text style={s.infoLabel}>보고서 생성일</Text>
          <Text style={s.infoValue}>{section.createdAt}</Text>
        </View>
      </View>
      <View style={s.infoRow}>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>상담 기관</Text>
          <Text style={s.infoValue}>{section.organization}</Text>
        </View>
        <View style={s.infoCellWithBorder}>
          <Text style={s.infoLabel}>상담사</Text>
          <Text style={s.infoValue}>{section.counselorName}</Text>
        </View>
      </View>
    </View>

    {/* 하단 안내 */}
    <Text style={s.disclaimer}>
      본 보고서는 가계도 면담 및 상담 축어록을 바탕으로 작성된 임상적 분석
      결과이며,
      {'\n'}전문적인 치료 계획 수립을 위한 참고 자료입니다
    </Text>

    {/* 로고 */}
    <Image src="/pdf/pdf_cover_logo.png" style={s.logoImage} />
  </Page>
);
