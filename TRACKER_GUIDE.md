# 파트너링 Tracker 연동 가이드

쇼핑몰에 파트너링 추적 스크립트를 연동하는 방법입니다.

---

## 방법 1 — 스크립트 태그 (가장 빠름)

모든 페이지의 `<head>` 또는 `</body>` 직전에 한 줄 삽입합니다.

```html
<script src="https://partnering.com/tracker.js?shop=YOUR_SHOP_ID"></script>
```

`YOUR_SHOP_ID`는 파트너링 관리자 페이지에서 확인하세요.

### 옵션
| 파라미터 | 기본값 | 설명 |
|---|---|---|
| `shop` | 필수 | 쇼핑몰 고유 ID |
| `days` | 30 | 쿠키 유지 기간 (일) |

```html
<!-- 쿠키 60일 유지 -->
<script src="https://partnering.com/tracker.js?shop=gulbi123&days=60"></script>
```

---

## 방법 2 — 수동 이벤트 (정확한 추적 권장)

스크립트 삽입 후, **구매 완료 페이지**에서 아래 함수를 호출합니다.

```html
<!-- 구매 완료 페이지 -->
<script>
Partnering.track({
  orderId: 'ORD-20260513-001',  // 주문 번호
  amount:  50000,               // 실결제 금액 (원)
});
</script>
```

### 상품 정보 포함 (선택)
```js
Partnering.track({
  orderId: 'ORD-20260513-001',
  amount:  50000,
  items: [
    { id: 'PROD-001', name: '영광 굴비 선물세트', price: 50000, qty: 1 },
    { id: 'PROD-002', name: '천일염 3kg',          price: 15000, qty: 2 },
  ],
});
```

---

## 방법 3 — Next.js / React (SPA)

```js
// _app.tsx 또는 layout.tsx
useEffect(() => {
  if (typeof window !== 'undefined' && window.Partnering) {
    window.Partnering.init({ shopId: 'YOUR_SHOP_ID' });
  }
}, []);

// 구매 완료 페이지 (예: /order/complete)
useEffect(() => {
  if (order && typeof window !== 'undefined' && window.Partnering) {
    window.Partnering.track({
      orderId: order.id,
      amount:  order.totalAmount,
    });
  }
}, [order]);
```

또는 `<Script>` 태그로 삽입:

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://partnering.com/tracker.js?shop=YOUR_SHOP_ID"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 방법 4 — 굴비가게 (직접 개발 쇼핑몰)

직접 개발하는 쇼핑몰은 처음부터 수동 이벤트 방식으로 심어두면 됩니다.

```tsx
// app/shop/order/complete/page.tsx
'use client'
import { useEffect } from 'react'

export default function OrderCompletePage({ order }) {
  useEffect(() => {
    // 파트너링 전환 이벤트
    if (window.Partnering) {
      window.Partnering.track({
        orderId: order.id,
        amount:  order.totalAmount,
        items:   order.items.map(item => ({
          id:    item.productId,
          name:  item.name,
          price: item.price,
          qty:   item.quantity,
        })),
      });
    }
  }, []);

  return <div>주문이 완료되었습니다!</div>;
}
```

---

## 자동 감지 지원 URL 패턴

스크립트가 자동으로 구매 완료 페이지를 감지하는 URL 패턴입니다.
수동 이벤트를 심기 어려운 경우에 사용됩니다.

```
/order/complete
/order/success
/checkout/complete
/checkout/success
/payment/complete
/payment/success
/thanks
/thank-you
?status=paid
?status=success
?result=success
```

---

## 디버그 모드

개발 중에는 콘솔에서 추적 로그를 확인할 수 있습니다.

```js
Partnering.init({ shopId: 'YOUR_SHOP_ID', debug: true });
```

---

## API 레퍼런스

| 메서드 | 설명 |
|---|---|
| `Partnering.init(options)` | SPA 환경에서 수동 초기화 |
| `Partnering.track(data)` | 구매 완료 이벤트 전송 |
| `Partnering.pageview()` | 페이지뷰 이벤트 전송 (선택) |
| `Partnering.getRef()` | 현재 파트너 ref 값 조회 |
| `Partnering.reset()` | ref 쿠키 초기화 |

---

## 동작 원리

```
파트너 링크 클릭
  → ?ref=파트너ID 포함된 URL로 쇼핑몰 이동
  → tracker.js가 ref를 쿠키에 저장 (기본 30일)
  → 쇼핑몰 탐색 중 쿠키 유지
  → 구매 완료 시 Partnering.track() 호출
  → 파트너링 서버로 전환 이벤트 전송
  → 파트너에게 수수료 적립
  → 쿠키 삭제 (중복 방지)
```

---

*문의: support@partnering.com*
