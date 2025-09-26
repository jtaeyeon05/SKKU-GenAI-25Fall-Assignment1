# SKKU-GenAI-Assignment1

> Portfolio Playground


성균관대학교 생성형딥러닝 Assignment1 입니다. Cursor를 통해 바이브 코딩하여 제작했습니다.

키보드와 화면 버튼으로 캐릭터를 조작하여 포트폴리오 정보를 탐험하는 인터랙티브 사이트입니다.

## 사용법
- 이동: 화살표 키 또는 WASD
- 열기: Space 또는 Enter (가까운 핫스팟에 접근 시)
- 닫기: Esc 또는 패널 바깥 클릭, 닫기 버튼
- 모바일: 화면의 방향키/액션 버튼 사용

## 구조
- `index.html`: 마크업과 패널/컨트롤 UI
- `style.css`: 장면, 플레이어, 패널, 컨트롤 스타일
- `script.js`: 움직임 로직, 근접 감지, 패널 열기/닫기

## 배포
- 라이브 링크: https://jtaeyeon05.github.io/SKKU-GenAI-25Fall-Assignment1/

## 커스터마이즈
- 핫스팟 위치: `index.html`의 `.hotspot` 요소 `style="left/top/right/bottom"` 속성 조정
- 패널 내용: `script.js`의 `openPanel(kind)` 내 `contentByKind` 수정
- 이동 속도: `script.js` 상단 `SPEED` 상수 (px/s)

---
© 2025 정태연
