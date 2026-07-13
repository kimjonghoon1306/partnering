/**
 * partnering tracker.js v1.0.0
 * 온파트너 제휴마케팅 추적 스크립트
 *
 * [사용법 1] 스크립트 태그 삽입 (모든 페이지 <head> 또는 <body> 끝)
 *   <script src="https://partnering.com/tracker.js?shop=SHOP_ID"></script>
 *
 * [사용법 2] 구매 완료 페이지에서 수동 이벤트 전송
 *   Partnering.track({ orderId: 'ORD-001', amount: 50000, items: [...] });
 *
 * [사용법 3] Next.js / React 등 SPA 환경
 *   import Partnering from 'partnering-tracker'; // npm 패키지 (추후 지원)
 *   Partnering.init({ shopId: 'SHOP_ID' });
 *   Partnering.track({ orderId: '...', amount: 50000 });
 */

(function (window, document) {
  'use strict';

  /* ───────────────────────────────────────────
   * 설정
   * ─────────────────────────────────────────── */
  var CONFIG = {
    SERVER:      'https://api.partnering.com/v1',  // 온파트너 API 서버
    COOKIE_KEY:  'ptnr_ref',                        // 파트너 ref 쿠키명
    COOKIE_DAYS: 30,                                // 쿠키 유지 기간 (일)
    PARAM:       'ref',                             // URL 파라미터명
    DEBUG:       false,                             // 디버그 모드
  };

  /* ───────────────────────────────────────────
   * 현재 스크립트 태그에서 shopId 추출
   * <script src="tracker.js?shop=SHOP_ID">
   * ─────────────────────────────────────────── */
  var currentScript = document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  var scriptSrc  = currentScript ? currentScript.src : '';
  var scriptParams = scriptSrc.split('?')[1] || '';
  var SHOP_ID = parseParam(scriptParams, 'shop') || '';

  // 스크립트 태그에서 쿠키 유지 기간 커스텀 가능
  var customDays = parseInt(parseParam(scriptParams, 'days'), 10);
  if (customDays > 0) CONFIG.COOKIE_DAYS = customDays;

  /* ───────────────────────────────────────────
   * 유틸 함수들
   * ─────────────────────────────────────────── */

  // URL 파라미터 파싱
  function parseParam(queryStr, key) {
    var match = queryStr.match(new RegExp('(?:^|&)' + key + '=([^&]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  // 쿠키 저장
  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + d.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) +
      expires + '; path=/; SameSite=Lax';
  }

  // 쿠키 읽기
  function getCookie(name) {
    var nameEQ = name + '=';
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    return null;
  }

  // 쿠키 삭제
  function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  // 현재 페이지 URL에서 파라미터 추출
  function getUrlParam(key) {
    return parseParam(window.location.search.slice(1), key);
  }

  // 서버로 전송
  function sendBeacon(endpoint, data) {
    var url = CONFIG.SERVER + endpoint;
    var payload = JSON.stringify(data);

    // sendBeacon 지원 시 우선 사용 (페이지 이탈 후에도 전송 보장)
    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      log('sendBeacon:', endpoint, data);
      return;
    }

    // fallback: fetch
    if (window.fetch) {
      fetch(url, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        payload,
        keepalive:   true,
      }).catch(function () {});
      log('fetch:', endpoint, data);
      return;
    }

    // fallback: XHR
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(payload);
    log('XHR:', endpoint, data);
  }

  function log() {
    if (CONFIG.DEBUG && window.console) {
      console.log('[Partnering]', Array.prototype.slice.call(arguments));
    }
  }

  /* ───────────────────────────────────────────
   * STEP 1: ref 파라미터 감지 → 쿠키 저장
   * ─────────────────────────────────────────── */
  function captureRef() {
    var ref = getUrlParam(CONFIG.PARAM);
    if (!ref) return;

    setCookie(CONFIG.COOKIE_KEY, ref, CONFIG.COOKIE_DAYS);
    log('ref 캡처:', ref);

    // 클릭 이벤트 서버 전송
    sendBeacon('/click', {
      shopId:    SHOP_ID,
      ref:       ref,
      url:       window.location.href,
      referrer:  document.referrer,
      ua:        navigator.userAgent,
      ts:        Date.now(),
    });
  }

  /* ───────────────────────────────────────────
   * STEP 2-A: 구매 완료 페이지 자동 감지
   * ─────────────────────────────────────────── */
  var PURCHASE_URL_PATTERNS = [
    /\/order\/complete/i,
    /\/order\/success/i,
    /\/checkout\/complete/i,
    /\/checkout\/success/i,
    /\/payment\/complete/i,
    /\/payment\/success/i,
    /\/purchase\/complete/i,
    /\/thanks/i,
    /\/thank-you/i,
    /order[_-]?complete/i,
    /order[_-]?success/i,
    /\?.*status=paid/i,
    /\?.*status=success/i,
    /\?.*result=success/i,
  ];

  // 금액 요소 자동 파싱 (한국 쇼핑몰 공통 패턴)
  var AMOUNT_SELECTORS = [
    '[class*="total-price"]',
    '[class*="total_price"]',
    '[class*="order-total"]',
    '[class*="order_total"]',
    '[class*="payment-amount"]',
    '[class*="paymentAmount"]',
    '[id*="totalPrice"]',
    '[id*="total_price"]',
    '[id*="orderTotal"]',
    '[data-total-price]',
    '[data-order-amount]',
  ];

  var ORDER_ID_SELECTORS = [
    '[class*="order-number"]',
    '[class*="order_number"]',
    '[class*="orderNumber"]',
    '[id*="orderNumber"]',
    '[id*="order_number"]',
    '[data-order-id]',
    '[data-order-number]',
  ];

  function parseAmount(text) {
    // "₩50,000" "50,000원" "50000" 등 파싱
    var cleaned = text.replace(/[^0-9]/g, '');
    var num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  }

  function findAmount() {
    // data 속성 우선
    var els = document.querySelectorAll('[data-total-price],[data-order-amount],[data-amount]');
    for (var i = 0; i < els.length; i++) {
      var v = els[i].getAttribute('data-total-price') ||
              els[i].getAttribute('data-order-amount') ||
              els[i].getAttribute('data-amount');
      var n = parseAmount(v || '');
      if (n > 0) return n;
    }

    // CSS 셀렉터 탐색
    for (var j = 0; j < AMOUNT_SELECTORS.length; j++) {
      try {
        var el = document.querySelector(AMOUNT_SELECTORS[j]);
        if (el) {
          var amount = parseAmount(el.textContent || el.value || '');
          if (amount > 0) return amount;
        }
      } catch (e) {}
    }

    return 0;
  }

  function findOrderId() {
    for (var i = 0; i < ORDER_ID_SELECTORS.length; i++) {
      try {
        var el = document.querySelector(ORDER_ID_SELECTORS[i]);
        if (el) {
          return (el.textContent || el.value || el.getAttribute('data-order-id') || '').trim();
        }
      } catch (e) {}
    }
    // URL에서 orderId 파라미터 추출 시도
    return getUrlParam('orderId') || getUrlParam('order_id') || getUrlParam('orderNo') || '';
  }

  function isPurchasePage() {
    var url = window.location.href;
    for (var i = 0; i < PURCHASE_URL_PATTERNS.length; i++) {
      if (PURCHASE_URL_PATTERNS[i].test(url)) return true;
    }
    return false;
  }

  function autoTrack() {
    if (!isPurchasePage()) return;
    var ref = getCookie(CONFIG.COOKIE_KEY);
    if (!ref) return;  // 파트너 링크로 유입된 사용자가 아님

    var amount  = findAmount();
    var orderId = findOrderId();

    log('자동 감지 구매:', { orderId: orderId, amount: amount, ref: ref });

    sendBeacon('/conversion', {
      shopId:    SHOP_ID,
      ref:       ref,
      orderId:   orderId,
      amount:    amount,
      mode:      'auto',
      url:       window.location.href,
      ts:        Date.now(),
    });

    deleteCookie(CONFIG.COOKIE_KEY);  // 중복 전송 방지
  }

  /* ───────────────────────────────────────────
   * STEP 2-B: 수동 이벤트 API
   * 쇼핑몰 개발자가 직접 호출
   * ─────────────────────────────────────────── */
  var Partnering = {

    /**
     * 초기화 (SPA 환경에서 shopId를 코드로 전달할 때)
     * @param {Object} options - { shopId: string, cookieDays: number, debug: boolean }
     */
    init: function (options) {
      options = options || {};
      if (options.shopId)     SHOP_ID           = options.shopId;
      if (options.cookieDays) CONFIG.COOKIE_DAYS = options.cookieDays;
      if (options.debug)      CONFIG.DEBUG       = options.debug;
      captureRef();
      log('초기화 완료. shopId:', SHOP_ID);
    },

    /**
     * 구매 완료 이벤트 수동 전송
     * @param {Object} data - { orderId, amount, items, customData }
     *
     * 사용 예시:
     *   // 구매 완료 페이지에서
     *   Partnering.track({ orderId: 'ORD-001', amount: 50000 });
     *
     *   // 상품 정보 포함
     *   Partnering.track({
     *     orderId: 'ORD-001',
     *     amount: 50000,
     *     items: [
     *       { id: 'PROD-1', name: '굴비 선물세트', price: 50000, qty: 1 }
     *     ]
     *   });
     */
    track: function (data) {
      data = data || {};
      var ref = getCookie(CONFIG.COOKIE_KEY);
      if (!ref) {
        log('파트너 ref 없음 — 전송 생략');
        return;
      }

      sendBeacon('/conversion', {
        shopId:     SHOP_ID,
        ref:        ref,
        orderId:    data.orderId    || '',
        amount:     data.amount     || 0,
        items:      data.items      || [],
        customData: data.customData || {},
        mode:       'manual',
        url:        window.location.href,
        ts:         Date.now(),
      });

      deleteCookie(CONFIG.COOKIE_KEY);  // 중복 전송 방지
      log('수동 트래킹 전송:', data);
    },

    /**
     * 현재 저장된 파트너 ref 조회
     * @returns {string|null}
     */
    getRef: function () {
      return getCookie(CONFIG.COOKIE_KEY);
    },

    /**
     * ref 쿠키 수동 초기화
     */
    reset: function () {
      deleteCookie(CONFIG.COOKIE_KEY);
      log('ref 초기화');
    },

    /**
     * 페이지뷰 이벤트 (선택)
     * 파트너 유입 후 페이지 탐색 추적용
     */
    pageview: function () {
      var ref = getCookie(CONFIG.COOKIE_KEY);
      if (!ref) return;
      sendBeacon('/pageview', {
        shopId: SHOP_ID,
        ref:    ref,
        url:    window.location.href,
        ts:     Date.now(),
      });
    },
  };

  /* ───────────────────────────────────────────
   * SPA (React/Next.js 등) 라우팅 대응
   * popstate, hashchange 이벤트 감지
   * ─────────────────────────────────────────── */
  var lastUrl = window.location.href;

  function onRouteChange() {
    var currentUrl = window.location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;

    captureRef();   // 새 URL에 ref 파라미터 있을 수 있음
    autoTrack();    // 구매 완료 페이지인지 재확인
    log('라우트 변경:', currentUrl);
  }

  window.addEventListener('popstate',    onRouteChange);
  window.addEventListener('hashchange',  onRouteChange);

  // Next.js App Router 등 history.pushState 오버라이드
  (function () {
    var origPush    = history.pushState;
    var origReplace = history.replaceState;

    history.pushState = function () {
      origPush.apply(history, arguments);
      onRouteChange();
    };
    history.replaceState = function () {
      origReplace.apply(history, arguments);
      onRouteChange();
    };
  })();

  /* ───────────────────────────────────────────
   * 실행
   * ─────────────────────────────────────────── */
  captureRef();   // ref 파라미터 감지 즉시 실행

  // DOM 로드 후 자동 감지 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoTrack);
  } else {
    autoTrack();
  }

  // 전역 노출
  window.Partnering = Partnering;

})(window, document);
