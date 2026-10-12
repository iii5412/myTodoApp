# 할 일 (myTodoApp) — AI 작업 지침

개인용 안드로이드 할 일 앱이다. Claude, Codex 등 모든 AI 에이전트는 이 문서를 따른다. 사용자에게 보이는 문구는 한국어.

## 구조

- 화면: React 19 + Vite + Tailwind 4 (`src/`). 폰 한 손 사용이 기준이다. 터치 영역은 44px 이상, 글씨는 크게, 색 라벨과 남은 개수로 한눈에 보이게 한다.
- 데이터: **기기 로컬 저장**(`localStorage`, `src/lib/storage.ts`). 서버·DB·계정이 없다. 할 일 데이터를 서버로 보내는 기능을 만들지 않는다.
- 서버: Express (`src/server/`). 웹 화면, Android 화면 묶음(`/api/live-update`), 상태 확인(`/api/health`)만 제공한다.
- Android: Capacitor 8 (`android/`). 잠금 해제 시 자동 실행은 Java 네이티브 코드다.
  - `UnlockLaunchService`: 포그라운드 서비스. `USER_PRESENT`(잠금 해제)를 받아 앱을 띄운다. "다른 앱 위에 표시" 권한이 없거나 시스템이 막으면 알림으로 대신한다.
  - `UnlockLaunchPlugin`: 설정 화면의 스위치와 권한 안내(JS 쪽은 `src/native/unlockLaunch.ts`).
  - `BootReceiver`: 재부팅·앱 업데이트 뒤 서비스를 다시 시작한다.
- 데이터 로직은 `src/lib/todos.ts`에 순수 함수로 모여 있다. 화면 코드에서 목록을 직접 조작하지 말고 여기에 함수를 추가하고 테스트한다.

## 배포 흐름 (main에 반영되면 자동)

1. `.github/workflows/ci.yml`: 타입 체크, 단위 테스트, 빌드.
2. 통과하면 `.github/workflows/deploy.yml`이 Cloud Run에 배포한다. 기존 서비스는 새 버전을 먼저 트래픽 없이 올리고, 확인을 통과해야 전환한다.
3. 같은 이미지에 Android 화면 묶음이 들어 있어, 설치된 앱은 새 화면을 내려받는다(`src/lib/liveUpdate.ts`).

main에 들어가는 모든 변경은 곧 운영에 나간다. 설정 절차는 [docs/AUTO-DEPLOY-SETUP.md](docs/AUTO-DEPLOY-SETUP.md). push는 사용자가 승인한 경우에만 한다.

## 반드시 지킬 것

- 작업을 끝내기 전에 `npm run lint`와 `npm test`를 통과시킨다.
- 비밀값(keystore, 비밀번호, 서비스 계정 키)을 코드, 문서, 커밋에 넣지 않는다. 저장소는 공개 저장소다. `android/keystore.properties`, `*.jks`는 Git에서 제외되어 있다.
- 사용자의 할 일·이력을 지우거나 덮어쓰는 마이그레이션을 만들지 않는다. 저장 형식(`mytodo.data.v1`)을 바꿀 땐 기존 데이터를 읽어 변환하는 코드를 같이 넣는다.
- `UnlockLaunchService`의 리시버는 `RECEIVER_EXPORTED`로 등록해야 한다. `USER_PRESENT`는 시스템 UID가 아니라 SystemUI가 보내서, `NOT_EXPORTED`로 등록하면 전달되지 않는다(에뮬레이터에서 확인). 보호된 브로드캐스트라 외부 앱이 위조할 수 없다.

## Android 네이티브를 바꿀 때

`android/` 아래 코드, Capacitor 플러그인 추가·변경, `capacitor.config.ts` 변경은 새 APK가 필요하다.

- 같은 변경에서 `android/app/build.gradle`의 `versionCode`를 1 올리고 `versionName`도 올린다. 화면 묶음은 새 `versionCode` 이상의 APK에서만 적용되어, 예전 APK가 없는 네이티브 기능을 호출하지 않는다.
- PR 설명 맨 위에 "APK 재설치 필요"라고 적는다.

화면(`src/` 중 서버 제외)과 서버만 바꾸는 변경은 `versionCode`를 올리지 않는다.

## 명령

```bash
npm run dev            # 개발 서버 (Vite 미들웨어 포함, 3000 포트)
npm run lint           # 타입 체크
npm test               # 단위 테스트
npm run build          # 웹 + 서버 번들
npm run android:debug  # 개발용 APK (docs/ANDROID.md)
```
