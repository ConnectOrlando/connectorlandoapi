/* eslint-disable unicorn/no-array-push-push */
import { clearDB } from './util.js';
import { faker } from '@faker-js/faker';
import prisma from './prisma.js';

async function seed() {
  await clearDB();

  const users = [];
  const companies = [];
  let i = 0;
  while (i < 10) {
    users.push({
      name: faker.name.fullName(),
      password: faker.internet.password(),
      isEmailVerified: true,
      get email() {
        const [firstName, lastName] = this.name.split(' ');
        return faker.internet.email(firstName, lastName);
      },
      isInvestor: getRandomBoolean(),
    });
    companies.push({
      name: faker.company.name(),
      type: getRandomBoolean() ? 'TECHNOLOGY' : 'FINANCE',
      mission: faker.company.bs(),
      bio: faker.company.catchPhrase(),
      employees: getRandomNumber(10, 1000),
    });
    companies.push({
      name: faker.company.name(),
      type: getRandomBoolean() ? 'TECHNOLOGY' : 'FINANCE',
      mission: faker.company.bs(),
      bio: faker.company.catchPhrase(),
      employees: getRandomNumber(10, 1000),
    });
    companies.push({
      name: faker.company.name(),
      type: getRandomBoolean() ? 'TECHNOLOGY' : 'FINANCE',
      mission: faker.company.bs(),
      bio: faker.company.catchPhrase(),
      employees: getRandomNumber(10, 1000),
    });
    i++;
  }

  const usersInDb = [];
  for (const user of users) {
    usersInDb.push(
      await prisma.user.create({
        data: user,
      })
    );
  }
  const companiesInDb = [];
  for (const company of companies) {
    const randomIndex = getRandomNumber(2, 4);
    company.ownerId = usersInDb[randomIndex].id;
    company.favoritedBy = {
      connect: usersInDb.slice(getRandomNumber(5, 8)).map(user => {
        return { id: user.id };
      }),
    };
    updateCompanyWithRandomUser(company, usersInDb);
    companiesInDb.push(
      await prisma.business.create({
        data: company,
      })
    );
  }
}

await seed();

function updateCompanyWithRandomUser(company, usersInDb) {
  if (getRandomBoolean()) {
    const randomUserIndex = getRandomNumber(0, 9);
    const randomUser = usersInDb[randomUserIndex];
    if (randomUser?.isInvestor && company.ownerId !== randomUser?.id) {
      company.connections = {
        create: {
          userId: randomUser.id,
          connectedOn: new Date(),
        },
      };
    }
  }
}

function getRandomBoolean() {
  return getRandomNumber(0, 10) % 2 === 0;
}

function getRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
