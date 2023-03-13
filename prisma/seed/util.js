import prisma from './prisma.js';

export function toRange(n) {
  return Array.from({ length: n });
}

export async function clearDB() {
  const SQL_QUERY = `SELECT
  'TRUNCATE "' || tablename || '" CASCADE;'
  from
  pg_tables WHERE schemaname = 'public';`; // goes through the pg_tables table and sees what tables were created under my user
  // And returns a list of queries to run to TRUNCATE the tables
  const listOfTables = await prisma.$queryRawUnsafe(SQL_QUERY); // comes back as [{$column: QUERY},...]
  for (const query of listOfTables) {
    await prisma.$executeRawUnsafe(Object.values(query));
  }
}
