# 할 일 (myTodoApp)

안드로이드에서 쓰는 개인용 할 일 앱.

- **잠금을 풀면 바로 실행**되어 오늘 할 일이 한눈에 보인다.
- 할 일을 **길게 눌러 위아래로 드래그**해서 순서를 바꾼다.
- 색 라벨, 남은 개수, 오늘 완료 진행 막대로 상태가 바로 보인다.
- 완료하면 **설정 > 완료 이력**에 날짜별로 쌓이고, 다시 할 일로 되돌릴 수 있다.
- 데이터는 **폰 안에만** 저장된다(서버로 보내지 않는다).

## 개발

```bash
npm install
npm run dev     # http://localhost:3000
npm test
```

## 문서

- [docs/ANDROID.md](docs/ANDROID.md): APK 빌드·설치, 잠금 해제 자동 실행 설정
- [docs/AUTO-DEPLOY-SETUP.md](docs/AUTO-DEPLOY-SETUP.md): GitHub + Cloud Run 자동 배포 설정
- [AGENTS.md](AGENTS.md): AI 에이전트 작업 지침
