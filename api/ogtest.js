// @vercel/og 최소 테스트 — 폰트/DB 없이 렌더 되는지 확인용(진단 후 삭제)
import { ImageResponse } from '@vercel/og';
export const config = { runtime: 'edge' };

export default function handler() {
  return new ImageResponse(
    { type: 'div', props: { style: { width: '600px', height: '300px', background: '#e5457a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }, children: 'OG TEST 123' } },
    { width: 600, height: 300 }
  );
}
