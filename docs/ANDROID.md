# Android 앱 빌드와 설치

앱 ID `com.iii5412.mytodo`, Android 7.0(API 24) 이상. Capacitor 8 기반이며 할 일은 폰에 저장된다.

## 준비물

- Node 22, JDK 21 (`JAVA_HOME`), Android SDK Platform 36 (`android/local.properties`의 `sdk.dir`)
- 서버 주소(`VITE_API_BASE_URL`)는 **선택**이다. 비워 두면 APK는 그대로 동작하고 화면 자동 업데이트만 꺼진다. Cloud Run 배포 후 서비스 URL을 넣어 다시 빌드한다.

```dotenv
# 루트의 .env.production.local (Git 제외)
VITE_API_BASE_URL=https://mytodo-xxxx.a.run.app
```

경로 없는 HTTPS 주소만 쓴다.

## 개발용 APK

```powershell
npm install
$env:JAVA_HOME = "<JDK 21 경로>"
npm run android:debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

개발용 서명은 PC마다 다르다. 다른 PC에서 만든 APK는 기존 설치 위에 덮어쓸 수 없으니, 오래 쓸 APK는 아래 릴리스 서명을 쓴다.

## 업데이트 가능한 릴리스 APK

한 번 만든 keystore는 이후에도 같은 파일·alias를 써야 한다. 분실하면 기존 앱 위에 업데이트할 수 없다. **keystore는 저장소에 올리지 않는다.**

```powershell
keytool -genkeypair -v -keystore android/release-key.jks -alias mytodo -keyalg RSA -keysize 2048 -validity 10000
```

`android/keystore.properties`를 만든다(Git 제외).

```properties
storeFile=release-key.jks
storePassword=...
keyAlias=mytodo
keyPassword=...
```

```powershell
npm run android:release
```

## 잠금 해제하면 바로 열기

앱 설정(오른쪽 위 톱니) > **잠금 해제하면 바로 열기**를 켠다. 아래 권한을 순서대로 허용한다.

| 권한 | 필요한 이유 |
|---|---|
| 다른 앱 위에 표시 (필수) | 안드로이드는 백그라운드 앱이 스스로 화면을 띄우는 것을 막는다. 이 권한이 있어야 잠금을 푸는 순간 앱이 열린다. |
| 알림 | 켜져 있는 동안 작은 상태 알림을 보여 주고, 바로 열기가 막힌 경우 "눌러서 확인" 알림으로 대신한다. |
| 배터리 제한 없음 | 삼성 등 제조사의 절전 기능이 감시를 끄는 것을 막는다. |

동작 원리: 포그라운드 서비스가 `USER_PRESENT`(잠금 해제)를 받아 앱을 연다. 재부팅하면 `BootReceiver`가 서비스를 다시 켠다. 설정에서 스위치를 끄면 서비스와 알림이 모두 사라진다.

안 열릴 때 확인할 것:

1. 세 권한이 모두 체크(초록)인지. 특히 "다른 앱 위에 표시".
2. 제조사 앱 목록의 "절전/백그라운드 제한"에서 이 앱이 제한 대상이 아닌지.
3. 화면 잠금(PIN·패턴·지문)이 설정되어 있는지. 잠금이 없으면 안드로이드가 `USER_PRESENT`를 보내지 않는다.

## 에뮬레이터 검증 (참고)

Android 15 에뮬레이터에서 확인한 항목: 잠금 해제 시 앱 실행, 권한이 없을 때 알림 폴백, 재설치 후 서비스 자동 재시작, 길게 눌러 드래그, 강제 종료 후 데이터 유지. 에뮬레이터에 PIN을 걸어야 잠금 해제 이벤트가 나온다.

```bash
adb shell locksettings set-pin 1234
adb shell appops set com.iii5412.mytodo SYSTEM_ALERT_WINDOW allow
adb logcat -s UnlockLaunch:V
```
