import { PrismaClient } from '@prisma/client';

/*
This will generate only one client instance no matter
how many times this is imported into a file because of how
node caches modules when they are imported for the first time. 
https://nodejs.org/api/modules.html#modules_caching

And by doing it this way, we get the intellisense from Prisma automatically
*/
const prisma = new PrismaClient();

export default prisma;
