# Unifor Manager — Frontend

Frontend da aplicação **Unifor Manager**, sistema de gestão de matrículas e turmas para coordenadores e alunos. Desenvolvido em Angular com PrimeNG e autenticação Keycloak.

## Stack

- **Angular** 21
- **Nx** (workspace e build)
- **PrimeNG** (UI: tabelas, formulários, diálogos)
- **Keycloak** (autenticação e papéis: coordenador / aluno)
- **RxJS** (fluxo reativo)

## Pré-requisitos

- **Node.js** 20+ e **npm**
- Backend da API em execução (ver [FRONTEND_CONTRACT.md](documentation/FRONTEND_CONTRACT.md))
- Instância Keycloak configurada (realm, client)

## Desenvolvimento

```bash
npm install
npm start
```

Abre em [http://localhost:4200](http://localhost:4200). A aplicação usa por padrão:

- **API:** `http://localhost:8080`
- **Keycloak:** `http://localhost:8081` (realm: `unifor`, client: `unifor-manager`)

Altere em `src/environments/environment.ts` se necessário.

## Build

```bash
npm run build
```

Build de produção em `dist/unifor-manager-frontend/browser/`. Para customizar API e Keycloak em produção, edite `src/environments/environment.prod.ts` antes do build.

## Docker

Build e execução com Docker Compose:

```bash
docker compose up --build
```

A aplicação fica disponível em [http://localhost:4200](http://localhost:4200). Por padrão a imagem é construída com:

- **API:** `http://localhost:8080`
- **Keycloak:** `http://localhost:8081` (realm `unifor`, client `unifor-manager`)

Assim o login redireciona para o Keycloak no host. Para usar outras URLs (por exemplo Keycloak em outro servidor), passe os build args:

```bash
docker compose build --build-arg API_URL=https://api.seudominio.com --build-arg KEYCLOAK_URL=https://auth.seudominio.com
docker compose up -d
```

## Testes

```bash
npm test
```

Executa os testes unitários com Vitest.

## Estrutura do projeto

- **`src/app/`** — Componente raiz, shell (header, sidebar, navegação), rotas e páginas (matrizes, turmas, matrículas, turmas disponíveis).
- **`libs/api/`** — Serviços REST (coordenador, aluno), DTOs, interceptors (token, erros), formatação de horários.
- **`libs/auth/`** — Guards (auth, role, redirect por perfil), interceptor de erro de autenticação.
- **`src/environments/`** — Configuração de ambiente (API, Keycloak).
- **`documentation/`** — [ARCHITECTURE.md](documentation/ARCHITECTURE.md), [FRONTEND_CONTRACT.md](documentation/FRONTEND_CONTRACT.md), [PRD.md](documentation/PRD.md).

## Documentação

- [ARCHITECTURE.md](documentation/ARCHITECTURE.md) — Arquitetura técnica e estrutura Nx.
- [FRONTEND_CONTRACT.md](documentation/FRONTEND_CONTRACT.md) — Contrato com o backend (endpoints, DTOs).
- [PRD.md](documentation/PRD.md) — Requisitos e regras de negócio.

## Licença

Uso interno / acadêmico conforme definido pelo projeto Unifor Manager.
