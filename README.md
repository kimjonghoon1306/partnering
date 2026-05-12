# 파트너링 (Partnering)

제휴마케팅 플랫폼 — 링크 하나로 수익을 만드세요.

## 프로젝트 구조

```
partnering/
├── index.html              # 랜딩페이지
├── pages/
│   └── dashboard.html      # 파트너 대시보드
├── css/
│   ├── variables.css       # 디자인 토큰 (색상, 폰트, 간격)
│   ├── reset.css           # 리셋 + 공통 컴포넌트
│   ├── main.css            # 랜딩페이지 스타일
│   └── dashboard.css       # 대시보드 스타일
├── js/
│   ├── main.js             # 랜딩페이지 스크립트
│   └── dashboard.js        # 대시보드 스크립트
└── README.md
```

## 디자인 시스템

- **주색상**: `#BEFF00` (일렉트릭 라임)
- **배경**: `#080808` (딥 다크)
- **폰트**: Pretendard Variable
- **테마**: 다크 모드 전용

## 페이지

### 랜딩페이지 (`index.html`)
- 히어로 섹션 + 플로팅 수익 카드
- 카테고리별 수수료 슬라이더
- 기능 벤토 그리드
- 파트너 후기

### 대시보드 (`pages/dashboard.html`)
- 오버뷰: 수익 요약 + 차트
- 내 링크: 링크 생성 + 성과 테이블
- 수익 현황: 월별 차트
- 정산 내역
- 알림
- 설정

## 개발 시작

별도 빌드 도구 필요 없음. 브라우저에서 바로 열거나 로컬 서버로 실행:

```bash
npx serve .
# 또는
python -m http.server 8080
```

## © 2026 파트너링
