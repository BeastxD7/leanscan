/**
 * Deprecated — kept as a stub for anyone who still types `tsx scripts/migrate.ts`.
 *
 * Migrations are now managed by Prisma. Use:
 *   npm run migrate:dev      (local — generates new migration + applies)
 *   npm run migrate          (CI / production — applies pending migrations only)
 *   npm run prisma:studio    (visual DB explorer)
 *
 * Schema lives in coding/api/prisma/schema.prisma.
 * Migration SQL files live in coding/api/prisma/migrations/.
 */
console.error(
  '⚠️  This runner is deprecated. Use one of:\n' +
    '    npm run migrate         (apply pending migrations)\n' +
    '    npm run migrate:dev     (create + apply new migration from schema diff)\n' +
    '    npm run prisma:studio   (DB browser)\n',
);
process.exit(1);
