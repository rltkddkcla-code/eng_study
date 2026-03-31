# 초보자 영어회화 패턴 학습 앱 구현 가이드

## 목표
- **혼자 쓰는 자기학습 앱**
- 한국어 문장을 보고 영어를 말하거나 입력
- `정답 보기` 후 자기평가 + 실수 유형 기록
- 실수 통계를 누적해 `자주 하는 실수` 탭 제공
- light-verb(예: take, make, have, give, get) 중심 패턴 학습
- 정답 확인 후 동일 패턴의 응용 표현 제공
- 스마트폰에서 동작
- Google Apps Script 기반 + Telegram bot 확장 가능

## 현재 포함 기능
1. 모바일 웹 UI (Apps Script HTMLService)
2. 패턴 랜덤 출제 (한국어 -> 영어)
3. 정답/패턴/응용 문장 표시
4. 자기평가 점수 + 실수 태그 저장
5. 누적 실수 랭킹 표시
6. Telegram bot `/next`, `/show` 명령 지원 (옵션)

## 데이터 구조 (Google Spreadsheet)
- `patterns`: 문제 은행
  - `id`, `ko_prompt`, `en_answer`, `pattern`, `slots`, `tags`
- `sessions`: 학습 이력
  - 문제, 사용자 답안, 점수, 실수 태그, 메모
- `mistakes`: 실수 집계
  - `mistake_tag`, `count`, `last_updated`

## 설치/배포 순서
1. 구글 스프레드시트 생성
2. Apps Script 열기
3. `Code.gs`, `Index.html` 붙여넣기
4. `setupSheets()` 1회 실행(권한 승인)
5. 웹앱 배포
   - 실행 사용자: 본인
   - 접근 권한: 링크 있는 사용자(개인용이면 본인만)
6. 모바일 브라우저에서 URL 열어 사용

## Telegram bot 연결 (선택)
1. BotFather에서 bot 생성
2. 스크립트 속성에 `TELEGRAM_BOT_TOKEN` 저장
3. 웹앱 URL을 webhook으로 설정
4. 텔레그램에서 `/next`, `/show` 사용

## 향후 개선 아이디어
- 음성 인식(Web Speech API)으로 말하기 평가
- 정답과 사용자 입력의 자동 비교(diff) 및 강조
- 실수 태그 자동 추천 (규칙 기반)
- spaced repetition(복습 간격 자동화)
- light-verb 패턴 200개 이상 확장
