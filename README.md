# eng_study

초보자를 위한 **영어회화 패턴 자기학습 앱**(Google Apps Script + Telegram bot 옵션) 예제입니다.

## 포함 파일
- `apps_script/Code.gs`: 서버 로직, 스프레드시트 저장, Telegram webhook 처리
- `apps_script/Index.html`: 모바일 웹 학습 UI
- `docs/IMPLEMENTATION_GUIDE_KO.md`: 한국어 구현/배포 가이드

## 핵심 기능
- 한국어 문장 제시 → 영어로 말하거나 입력
- `정답 보기` 후 정답/패턴/응용(light-verb 변형) 확인
- 자기평가 점수 및 실수 유형(어순/시제/전치사 등) 저장
- 누적 데이터를 기반으로 자주 하는 실수 대시보드 제공

자세한 설치 방법은 아래 문서를 참고하세요.
- `docs/IMPLEMENTATION_GUIDE_KO.md`
