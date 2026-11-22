# To-Do List (CRUD) — Node.js + PostgreSQL + Docker

CRUD simples de tarefas: adicionar, listar, atualizar (título / concluída) e remover.

## Estrutura

```
├── db/init.sql          # cria a tabela "tasks" na primeira subida do banco
├── public/index.html    # interface web
├── src/db.js            # conexão com o PostgreSQL
├── src/server.js        # API REST (Express)
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Como rodar

```bash
cp .env.example .env     # opcional, ajuste usuário/senha/porta
docker compose up -d --build
```

Acesse: http://localhost:3000

Para parar: `docker compose down` (adicione `-v` para apagar os dados do banco).

## Endpoints da API

| Método | Rota             | Descrição          | Corpo (JSON)                              |
|--------|------------------|--------------------|-------------------------------------------|
| GET    | /api/tasks       | Lista tarefas      | —                                         |
| GET    | /api/tasks/:id   | Busca uma tarefa   | —                                         |
| POST   | /api/tasks       | Cria tarefa        | `{ "title": "...", "description": "..." }` |
| PUT    | /api/tasks/:id   | Atualiza tarefa    | `{ "title"?, "description"?, "done"? }`   |
| DELETE | /api/tasks/:id   | Remove tarefa      | —                                         |

### Exemplos com curl

```bash
curl -X POST localhost:3000/api/tasks -H "Content-Type: application/json" -d '{"title":"Estudar Docker"}'
curl localhost:3000/api/tasks
curl -X PUT localhost:3000/api/tasks/1 -H "Content-Type: application/json" -d '{"done":true}'
curl -X DELETE localhost:3000/api/tasks/1
```
