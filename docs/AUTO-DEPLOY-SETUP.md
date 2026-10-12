# 자동 배포 + 앱 화면 자동 업데이트 설정

목표: main에 반영하면 서버와 화면이 Cloud Run에 자동 배포되고, 폰의 앱은 새 화면을 내려받아 적용한다.

저장소: https://github.com/iii5412/myTodoApp (공개). Actions 실행 시간은 무료다. 비용은 Cloud Run 무료 사용량 안에서 동작하는 구조다(`min-instances 0`).

| 단계 | 하는 사람 | 시간 |
|---|---|---|
| 1. Google Cloud 연결 (Cloud Shell에 붙여넣기) | 사용자 | 15분 |
| 2. GitHub 저장소에 설정값 등록 | 사용자 | 5분 |
| 3. 첫 배포 실행 | 사용자 | 5분 |
| 4. 서비스 URL 등록 후 다시 배포, APK 빌드·설치 | 사용자 | 10분 |

expendBreak와 같은 Google Cloud 프로젝트를 써도 되고, 배포 계정과 이미지 보관함만 따로 만든다.

## 1. Google Cloud 연결

[Cloud Shell](https://console.cloud.google.com)(오른쪽 위 `>_`)에서 한다. 리전은 expendBreak와 같은 곳을 쓰는 것을 권장한다.

```bash
PROJECT_ID=gen-lang-client-0746071282
REGION=us-west1
GITHUB_REPO=iii5412/myTodoApp
gcloud config set project $PROJECT_ID
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SA=mytodo-deployer@$PROJECT_ID.iam.gserviceaccount.com

gcloud services enable run.googleapis.com artifactregistry.googleapis.com iamcredentials.googleapis.com sts.googleapis.com

gcloud iam service-accounts create mytodo-deployer --display-name="myTodoApp GitHub deploy"

for ROLE in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SA --role=$ROLE --condition=None
done

# 이미 github 풀이 있으면 아래 첫 줄은 "already exists" 오류가 나도 괜찮다.
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub"

gcloud iam workload-identity-pools providers create-oidc mytodo-provider \
  --location=global --workload-identity-pool=github \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$GITHUB_REPO'"

gcloud iam service-accounts add-iam-policy-binding $SA \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$GITHUB_REPO"
```

- 배포 전용 계정 `mytodo-deployer`는 Cloud Run 배포와 이미지 업로드 권한만 가진다.
- `attribute-condition` 때문에 `iii5412/myTodoApp`에서 실행된 GitHub 작업만 이 계정을 쓸 수 있다. 키 파일은 어디에도 저장하지 않는다.

이미지 보관함을 만들고 오래된 이미지는 자동 삭제한다.

```bash
gcloud artifacts repositories create mytodo --repository-format=docker --location=$REGION

cat > cleanup.json <<'EOF'
[
  {"name": "keep-recent", "action": {"type": "Keep"}, "mostRecentVersions": {"keepCount": 3}},
  {"name": "delete-old", "action": {"type": "Delete"}, "condition": {"olderThan": "604800s"}}
]
EOF
gcloud artifacts repositories set-cleanup-policies mytodo --location=$REGION --policy=cleanup.json --no-dry-run
```

GitHub에 등록할 값을 출력한다.

```bash
echo "GCP_WORKLOAD_IDENTITY_PROVIDER = projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/mytodo-provider"
echo "GCP_SERVICE_ACCOUNT = $SA"
echo "GCP_PROJECT_ID = $PROJECT_ID"
echo "GCP_REGION = $REGION"
```

## 2. GitHub 저장소에 설정값 등록

저장소 > Settings > Secrets and variables > Actions > **Variables** 탭에서 아래를 만든다(비밀값이 아니라 Variables다).

| 이름 | 값 |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | 위에서 출력한 값 |
| `GCP_SERVICE_ACCOUNT` | 위에서 출력한 값 |
| `GCP_PROJECT_ID` | 위에서 출력한 값 |
| `GCP_REGION` | 위에서 출력한 값 |
| `CLOUD_RUN_SERVICE` | `mytodo` (새로 만들 서비스 이름) |
| `VITE_API_BASE_URL` | **처음에는 비워 둔다**(서비스 URL은 첫 배포 후에 알 수 있다) |

터미널로 등록하려면(값만 바꿔서):

```bash
gh variable set GCP_REGION --body "us-west1" --repo iii5412/myTodoApp
```

## 3. 첫 배포

main에 push하면 CI가 돌고 통과하면 `Deploy app`이 실행된다. 수동 실행은 Actions > Deploy app > Run workflow. 서비스가 없으면 첫 배포가 만들어 주며(`--allow-unauthenticated`), 이후에는 새 버전을 트래픽 없이 올려 확인한 뒤 전환한다.

배포 요약(Summary)에 **서비스 URL**이 나온다.

## 4. 화면 자동 업데이트 연결

1. 서비스 URL을 `VITE_API_BASE_URL` 변수에 넣는다(경로 없는 HTTPS 주소).
2. Deploy app을 다시 실행한다. 이번에는 화면 묶음이 이미지에 포함된다.
3. 같은 URL로 APK를 빌드해 설치한다([ANDROID.md](ANDROID.md)). 이후 화면 수정은 APK 재설치 없이 main 반영만으로 앱에 전달된다. 앱을 오래 떠났다가 돌아오거나 완전히 껐다 켤 때 적용되고, 설정 화면에 "새 화면 적용하기" 버튼이 뜨면 바로 적용할 수 있다.

## 롤백과 문제 해결

- 롤백: Cloud Run 콘솔 > 서비스 > 수정 버전(Revisions)에서 이전 버전에 트래픽 100%.
- 배포가 "Repository variable ... is not set"으로 멈추면 2단계의 변수 이름을 확인한다.
- `Check the new revision`에서 실패하면 새 버전이 응답하지 않은 것이라 운영 트래픽은 이전 버전에 그대로 있다. Cloud Run 로그를 확인한다.
- 네이티브 코드를 바꾼 경우(`android/`)는 화면 업데이트로 전달되지 않는다. APK를 다시 빌드해 설치하고 `versionCode`를 올린다.
