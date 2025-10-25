# Mini Indexer

A minimal on-chain indexer that syncs Transfer events for a given ERC-20 token and stores them in PostgreSQL. Includes a lightweight REST API to query indexed transfers. Designed to run efficiently on Railway with CRON-based incremental sync.

**Live API**

➡️ https://bubbly-heart-production-763c.up.railway.app/transfers?limit=20

## 🛠 Tech Stack

| Component         | Technology                           |
| ----------------- | ------------------------------------ |
| Language          | TypeScript                           |
| Framework         | NestJS                               |
| Database ORM      | Prisma                               |
| Database          | PostgreSQL                           |
| RPC               | Infura                               |
| Blockchain Client | viem                                 |
| Node Runtime      | Node.js                              |
| Deployment        | Railway (API service + CRON indexer) |

## 🧪 Getting Started

1. Set Environment Variables

Create a `.env` file based on `.env.example`. For example:

```sh
RPC_URL=your_rpc_url
DATABASE_URL=your_database_url
PORT=3000

TOKEN_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 # USDC ERC20 token
START_BLOCK=23649607
BATCH_SIZE=50
CONFIRMATION_BLOCK=12
```

2. Install Dependencies

```sh
pnpm install
```

3. Initialize Database

```sh
pnpx prisma migrate dev --name init
pnpx prisma generate
```

4. Run Locally

```sh
pnpm run start:dev-api # Start API
pnpm run start:dev-indexer # Start indexer sync
```

API will be available at `http://localhost:3000/transfers?limit=20`.

## 🚀 Railway Deployment Model

Script Purpose:

```sh
npm run start:prod-api # Start HTTP API server
npm run start:prod-indexer # Run indexer once and exit (for cron)
```

The project is deployed as two services:

- API Service `npm run start:prod-api`. Always on, serves `/transfers`.
- Indexer Service `npm run start:prod-indexer`. Runs one sync every hour and exits.

## 🔍 API Example

GET /transfers?limit=20

Returns latest indexed transfers. USDC ERC20 token has been chosen in production.

```js
[
    {
        "id": 111268,
        "txHash": "0x...",
        "blockNumber": 23865320,
        "from": "0x...",
        "to": "0x...",
        "value": "1000000000000000000"
        "createdAt": "2025-10-24T20:50:54.442Z":
    }
]
```
