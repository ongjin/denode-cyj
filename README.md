# Denode_조용진 재고 관리 시스템

이 프로젝트는 NestJS + TypeORM 기반의 재고 관리 시스템이며, 다음과 같은 기능을 포함합니다:

* 사용자, 상품(Product), 재고(Stock), 재고 이력(StockHistory) 엔티티
* 낙관적 락(Optimistic Lock) 및 비관적 락(Pessimistic Lock) 처리 예시
* 샘플 데이터를 자동으로 생성하는 `SeederService`
* 환경별 `.env` 설정 지원(local, development, production)

---

## 목차

1. [Prerequisites](#prerequisites)
2. [환경변수 설정](#환경변수-설정)
3. [설치 및 실행](#설치-및-실행)
4. [샘플데이터 시딩](#샘플데이터-시딩)
5. [환경별 실행 스크립트](#환경별-실행-스크립트)
6. [테스트](#테스트)
7. [라이선스](#라이선스)

---

## Prerequisites

* Node.js v18.17.0
* npm 9.6.7
* MySQL 8.0

---

## 환경변수 설정

루트에 다음 파일들을 생성하여 환경별 설정을 분리합니다:

```bash
touch .env.local .env.development .env.production
```

예시 `.env.local`:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=1234
DB_DATABASE=inventory
JWT_SECRET=JWT_SECRET_KEY
JWT_EXPIRES_IN=3600s
# docker-compose는 기본적으로 development세팅. 로컬환경 실행 시 npm run start:local
```

`.env.development`, `.env.production` 역시 각 환경에 맞게 값 변경

---

## 설치 및 실행

```bash
# git clone
git clone https://github.com/ongjin/denode-cyj.git

# docker delpoy
docker-compose up --build -d

OR

# git clone
git clone https://github.com/ongjin/denode-cyj.git

# 의존성 설치
npm install

# 개발 서버 실행 (local)
npm run start:local
```

* `npm run start:local` 는 `NODE_ENV=local` 로 실행되며, `.env.local` → `.env` 순으로 로드합니다.
* 내부적으로 `SeederService`가 `OnApplicationBootstrap` 훅으로 자동 실행되어 샘플 데이터가 없으면 생성됩니다.

---

## 환경별 실행 스크립트

`package.json` 예시:

```json
"scripts": {
  "start:local": "set NODE_ENV=local&& nest start --watch",
  "start:dev":   "set NODE_ENV=development&& nest start --watch",
  "start:prod":  "set NODE_ENV=production&& node dist/main",
  "test":        "jest"
}

```

---

## 테스트

```bash
# 단위/통합 테스트 실행
npm test
```
