Welcome to your new TanStack app!

# Drizzle

As per this [this link](https://github.com/drizzle-team/drizzle-orm/issues/2601), for all json() type in generated schema, replace it with

```
json('col_name').$type<Record<string, any>>()
```

NOTE: it's col_name, not colName

# Getting Started

To run this application:

```bash
npm install
npm run dev
```

# Local Database Setup

The app talks to MySQL **8.0.42** via `DATABASE_URL` (see `src/db/index.ts`).
A reproducible local setup is provided so every dev gets the same DB quickly.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (Desktop or engine) with the
  `docker compose` CLI.

### One-time setup

```bash
cp .env.example .env        # DATABASE_URL + MYSQL_* defaults live here
npm run db:setup            # starts MySQL 8.0.42 and imports the seed dump
```

`npm run db:setup` will:

1. Start the `mysql:8.0.42` container defined in `docker-compose.yml` and wait
   until it is healthy.
2. Download the shared dev dump from S3 (cached under `scripts/db/.cache`, which
   is gitignored) and import it into the `lms_dev_db` database.

The default connection string is:

```
DATABASE_URL="mysql://root:root@localhost:3306/lms_dev_db"
```

### Everyday commands

| Command                        | What it does                                          |
| ------------------------------ | ----------------------------------------------------- |
| `npm run db:up`                | Start the MySQL container (keeps existing data).      |
| `npm run db:down`              | Stop the container (data is preserved in the volume). |
| `npm run db:seed`              | Re-import the cached dump into the running container. |
| `npm run db:seed -- --refresh` | Re-download the latest dump, then import it.          |
| `npm run db:reset`             | Wipe the data volume and re-seed from scratch.        |

### Notes

- MySQL runs on port `3306` by default. If that clashes with a local MySQL,
  set `MYSQL_PORT` in `.env` (e.g. `3307`) and update `DATABASE_URL` to match.
- Data persists in the `student_lms_mysql_data` Docker volume across restarts.
  Use `npm run db:reset` for a clean slate.

## Feature Preview Environments

Feature-branch preview environment setup, required variables, and manual debug
commands are documented in [`docs/feature-env.md`](docs/feature-env.md).

# Building For Production

To build this application for production:

```bash
npm run build
npm start   # serves .output/server/index.mjs on PORT (default 3000)
```

# Running in Docker

`docker-compose.yml` defines both the **app** and an optional **MySQL** service
(behind the `db` profile). Pick the mode that fits your setup:

| Command                 | What runs                  | Database                                        |
| ----------------------- | -------------------------- | ----------------------------------------------- |
| `npm run docker:up`     | App + MySQL containers     | Bundled `mysql` service                         |
| `npm run docker:up:app` | App container only         | MySQL on your host (via `host.docker.internal`) |
| `npm run db:up`         | MySQL container only       | For native `npm run dev`                        |
| `npm run docker:down`   | Stops all compose services | —                                               |

### Stack and entry point

| Item         | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Runtime      | Node.js 22 + TanStack Start / Nitro (`node-server` preset) |
| Build output | `.output/server/index.mjs`                                 |
| Default port | `3000` (override with `PORT` / `APP_PORT`)                 |
| DB config    | `DATABASE_URL` in `.env.local` (see below)                 |

### `DATABASE_URL` and `.env.local`

The app reads `DATABASE_URL` from the environment (see `src/db/index.ts`). When
running in Docker, Compose injects **`.env.local`** into the container via
`env_file` — nothing is baked into the image (see `.dockerignore`).

Use the same variable everywhere; only the **host** changes:

| How you run the app                                 | `DATABASE_URL` host    |
| --------------------------------------------------- | ---------------------- |
| `npm run dev` / `npm start` on your Mac             | `localhost`            |
| `npm run docker:up:app` (app container, DB on host) | `host.docker.internal` |
| `npm run docker:up` (full stack, bundled MySQL)     | `mysql`                |

Example `.env.local` for Docker with a MySQL instance on your Mac:

```env
DATABASE_URL=mysql://root@host.docker.internal:3306/lms_local_temp
```

For native dev, swap the host back to `localhost`:

```env
DATABASE_URL=mysql://root@localhost:3306/lms_local_temp
```

Inside a container, `localhost` is the container itself — not your machine.
`docker-compose.yml` sets `extra_hosts: host.docker.internal:host-gateway` so
the app container can reach MySQL listening on the host (Mac/Windows work out of
the box; Linux needs this mapping).

Do **not** list `DATABASE_URL` under `environment:` in compose — that would
override the value from `.env.local`.

### Quick start — app + host MySQL

```bash
# .env.local — DATABASE_URL with host.docker.internal (see above)
npm run docker:up:app
```

Open `http://localhost:3000` (or `${APP_PORT}` if set).

### Quick start — full stack (app + MySQL in Docker)

```bash
# .env.local — point DATABASE_URL at the compose service name:
# DATABASE_URL=mysql://root:root@mysql:3306/lms_dev_db
npm run docker:up
```

### Equivalent `docker run`

```bash
docker build -t student-lms .
docker run --rm -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  --env-file .env.local \
  -e NODE_ENV=production \
  student-lms
```

### Verify the container

With MySQL on the host and the app container up:

```bash
docker exec student-lms-app printenv DATABASE_URL
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/server-time
```

If the DB connection fails, confirm `DATABASE_URL` inside the container uses
`host.docker.internal` (not `localhost`). If port `3306` on the host is already
used by another MySQL instance, use the port your database actually listens on
in the connection string.

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
npm run test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
npm run lint
npm run format
npm run check
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Link } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/people',
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json() as Promise<{
      results: {
        name: string
      }[]
    }>
  },
  component: () => {
    const data = peopleRoute.useLoaderData()
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    )
  },
})
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ...

const queryClient = new QueryClient()

// ...

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools />
    </>
  ),
})
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from '@tanstack/react-query'

import './App.css'

function App() {
  const { data } = useQuery({
    queryKey: ['people'],
    queryFn: () =>
      fetch('https://swapi.dev/api/people')
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
    initialData: [],
  })

  return (
    <div>
      <ul>
        {data.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
npm install @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from '@tanstack/react-store'
import { Store } from '@tanstack/store'
import './App.css'

const countStore = new Store(0)

function App() {
  const count = useStore(countStore)
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
    </div>
  )
}

export default App
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from '@tanstack/react-store'
import { Store, Derived } from '@tanstack/store'
import './App.css'

const countStore = new Store(0)

const doubledStore = new Derived({
  fn: () => countStore.state * 2,
  deps: [countStore],
})
doubledStore.mount()

function App() {
  const count = useStore(countStore)
  const doubledCount = useStore(doubledStore)

  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
      <div>Doubled - {doubledCount}</div>
    </div>
  )
}

export default App
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).
