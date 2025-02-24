# API

Core API of MusicLab

## Running the app

### Dependencies

Setup nodejs version:

```bash
nvm use
```

Install necessary dependencies:

```bash
npm install
```

### Env vars

Copy necessary environment variables:

```bash
cp .env.sample .env
```

And give them values if empty.

### Infrastructure

Up necessary infrastructure:

```bash
npm run infra:up
```

Seed database with values:

```bash
npm run db:seed
```

### Start app

To start the app in dev mode use command:

```bash
npm run dev
```
