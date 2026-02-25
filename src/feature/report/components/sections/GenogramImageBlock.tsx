/**
 * 가계도 이미지 블록
 *
 * [커스텀 가이드]
 * - 기본 크기: width 400pt, height 250pt (section에서 override 가능)
 * - wrap={false}: 이미지가 페이지 경계에서 잘리지 않고 통째로 다음 페이지로 이동
 * - 캡션 스타일: styles.ts의 imageCaption
 * - objectFit: 'contain' (비율 유지) | 'cover' (채우기)
 */

import { Image, Text, View } from '@react-pdf/renderer';

import type { GenogramImageSection } from '../../types/reportSchema';
import { styles } from '../styles';

export const GenogramImageBlock = ({
  section,
}: {
  section: GenogramImageSection;
}) => (
  <View style={styles.imageContainer} wrap={false}>
    <Image
      src={section.imageData}
      style={[
        styles.image,
        {
          width: section.width || 400,
          height: section.height || 250,
        },
      ]}
    />
    {section.caption && (
      <Text style={styles.imageCaption}>{section.caption}</Text>
    )}
  </View>
);
