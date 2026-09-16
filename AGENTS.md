# 오늘급식 프로젝트 작업 가이드

이 문서는 나중에 까먹었을 때 열어보는 참고용입니다. 두 부분으로 나뉩니다: (1) 이 프로젝트에서 지키는 작업 규칙, (2) Codex 초보자용 치트시트.

### 배포 정보

- GitHub 저장소 `buriburiyj/today-meal`이 Cloudflare에 연동돼 있습니다.
- **배포는 수동입니다.** 작업 디렉터리에서 `npx wrangler deploy`를 실행해야 실제 사이트에 반영됩니다.
- `main` 브랜치 push는 코드 보관용이며, push만으로는 배포되지 않습니다.
- 확인 방법: `npx wrangler deployments list --name today-meal` 에서 Source가 `Unknown (deployment)`이면 수동 배포된 것입니다.
- 실제 사이트 주소: https://today-meal.buriburiyejun.workers.dev/

---

## 1. 프로젝트 작업 규칙

### 새 기능을 만들 때 순서

1. **Plan 모드로 먼저 계획 세우기**
   코드를 바로 만들지 않고, "어디를 어떻게 바꿀지" 계획부터 이야기합니다. 계획이 마음에 들면 승인하고 넘어갑니다.

2. **작업용 git worktree로 격리해서 작업**
   main 폴더를 직접 건드리지 않고, `<기능이름>` 브랜치로 별도 폴더를 만들어 그 안에서만 작업합니다. (예: `layout-tabs`, `streak-feature`)
   → main은 항상 "지금 바로 배포해도 되는 안전한 상태"로 유지됩니다.

3. **브라우저에서 직접 열어 테스트**
   `open <worktree 폴더>/index.html`로 열어서, 새 기능은 물론 **기존 기능(급식·시간표·구독·학원·디데이 등)이 하나도 안 깨졌는지** 확인합니다.

4. **정상 확인되면 그 브랜치에 커밋**

5. **main에 병합**
   보통 fast-forward 병합(충돌 없이 그대로 이어붙이기)이 됩니다.

6. **worktree 폴더 정리**
   `git worktree remove <폴더 경로>`로 다 쓴 작업 폴더를 지웁니다.

7. **GitHub에 push**
   `git push origin main` — push하면 Cloudflare가 자동으로 감지해서 실제 서비스(https://today-meal.buriburiyejun.workers.dev/)에 배포합니다.

### 꼭 지킬 것

- **main 브랜치에는 브라우저로 검증까지 끝난 것만 병합한다.** (push하는 즉시 실서비스에 자동 배포되기 때문)
- **민감정보(.env, API 키, 비밀번호)는 절대 커밋하지 않는다.** `.gitignore`가 이미 `.env`, `node_modules/`, `dist/` 등을 막아주고 있음.
- 커밋 메시지는 "무엇을 왜 바꿨는지" 한국어로 짧게 남긴다.
- 지금은 빌드 도구(Vite 등) 없이 `index.html`/`style.css`/`script.js` 3개 파일 구조를 그대로 유지한다. (나중에 필요해지면 별도로 전환 논의)

---

## 2. Codex 초보자 치트시트

### 자주 쓰는 키보드 단축키

| 키 | 하는 일 |
|---|---|
| `Shift+Tab` | 모드 전환 — 수동 승인 모드 → 자동 승인 모드 → **Plan 모드** 순서로 순환. 새 기능 시작할 땐 Plan 모드로 전환해서 씀 |
| `Esc` | 지금 하고 있는 걸 취소/빠져나가기 |
| `@` | 파일 경로를 자동완성해서 대화에 끼워 넣기 (예: `@index.html` 치면 그 파일 내용을 보여주며 이야기 가능) |
| `/` | 사용 가능한 명령어 목록 보기 |
| `Tab` | 자동완성 |
| `↑` (위 화살표) | 이전에 입력했던 내용 다시 불러오기 |
| `Ctrl+D` | Codex 종료 |

### 자주 쓰는 슬래시 명령어

| 명령어 | 하는 일 |
|---|---|
| `/help` | 명령어 도움말 보기 |
| `/compact` | 대화가 길어져서 무거워졌을 때, 지금까지 내용을 요약해서 가볍게 만들기 (중요한 맥락은 유지됨) |
| `/context` | 지금 대화가 용량(토큰)을 얼마나 쓰고 있는지 확인 |
| `/exit` | 종료 |

### 자주 쓰는 git 작업 흐름 (worktree 방식)

새 기능 작업을 시작할 때:
```bash
# 1. 작업용 폴더+브랜치 새로 만들기
git worktree add -b <기능이름> ../today-meal-<기능이름> main

# 2. 그 폴더로 가서 작업 (코드 수정은 Codex가 진행)
#    브라우저 확인: open ../today-meal-<기능이름>/index.html

# 3. 확인 끝나면 그 폴더 안에서 커밋
git -C ../today-meal-<기능이름> add .
git -C ../today-meal-<기능이름> commit -m "무엇을 왜 바꿨는지"
```

작업이 끝나고 main에 합칠 때:
```bash
# 4. main으로 병합
git merge <기능이름>

# 5. 다 쓴 작업 폴더 정리
git worktree remove ../today-meal-<기능이름>

# 6. GitHub에 올리기 → push하면 Cloudflare가 자동 배포함
git push origin main
```

### 헷갈리기 쉬운 점

- worktree를 쓰면 폴더가 여러 개가 됩니다. 지금 어느 폴더에서 작업 중인지 `pwd`로 항상 확인하는 습관을 들이면 좋습니다.
- worktree는 **커밋된 상태**를 기준으로 새로 만들어집니다. 아직 커밋 안 한 변경사항은 새 worktree에 안 들어가니, 먼저 커밋부터 하고 worktree를 만드는 게 안전합니다.
