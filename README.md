# Automacao DHA Deploy

Monorepo de deploy com o frontend Next.js em `frontend/` e o backend FastAPI em `backend/`.

## Estrutura

```txt
frontend/             # Frontend Next.js
backend/              # Backend FastAPI
docker-compose.yml    # Compose para Dokploy/producao
docker-compose.local.yml
.env.example
```

## Rodar localmente

Copie `.env.example` para `.env` e preencha os valores reais.

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:8000`

## Dokploy

1. Crie um app do tipo Docker Compose.
2. Aponte para este repositorio e use `docker-compose.yml` na raiz.
3. Cadastre as variaveis da `.env.example` no Dokploy.
4. Configure o dominio no service `frontend`, porta `3000`.
5. Mantenha `PYTHON_SERVICE_URL=http://backend:8000`.

O backend fica acessivel internamente pelo nome do service `backend`. Nao precisa expor a porta `8000` publicamente, a menos que voce queira acessar a API diretamente.

## Observacoes

- `FRONTEND_DATABASE_URL` usa formato Postgres normal, por exemplo `postgresql://...`.
- `BACKEND_DATABASE_URL` usa SQLAlchemy async, por exemplo `postgresql+asyncpg://...`.
- A chave do Supabase fica em `SUPABASE_SERVICE_ROLE_KEY`; o compose entrega essa mesma chave ao frontend como `SUPABASE_SERVICE_KEY`, que e o nome esperado pelo codigo atual.
