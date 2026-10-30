# App CRUD ejemplo T3-stack

Typesafe punta a punta con tRPC+Prisma integrado a Nextjs app router.

Librerias:
- Next Auth (SSO + Credentials)
- tRPC
- zod
- react-hook-forms
- Prisma (Neon)

UI y componentes:
- Tailwind CSS
- MUI

## Convenciones

- Estilos: el tema MUI ([src/styles/theme.ts](src/styles/theme.ts)) es la única fuente de colores, tipografía, bordes y estilos de componentes. Tailwind se usa solo para layout (flex, grid, gap, padding, max-width).
- Lógica derivada: va en módulos puros de `src/client/lib/` (solo `import type` desde alias) con tests `*.test.js` que se corren con `pnpm test` (`node --test`).
