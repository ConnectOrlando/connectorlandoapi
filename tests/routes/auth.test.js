import supertest from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/tools/prisma.js';
const request = supertest(app);

describe('Sign-in Routes', () => {
  let testUser;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'password',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({
      where: {
        id: testUser.id,
      },
    });
  });

  describe('POST /signin', () => {
    // Success test case
    it('should sign in a user with valid credentials', async () => {
      const response = await request.post('/signin').send({
        email: 'test@example.com',
        password: 'password',
      });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });

    // Email test case
    it('should return an error if email is not provided', async () => {
      const response = await request.post('/signin').send({
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'Must provide a valid email and password'
      );
    });

    // Password test case
    it('should return an error if password is not provided', async () => {
      const response = await request.post('/signin').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'Must provide a valid email and password'
      );
    });

    // User does not exist test case
    it('should return an error if the user does not exist', async () => {
      const response = await request.post('/signin').send({
        email: 'nonexistent@example.com',
        password: 'password',
      });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Account does not exist');
    });

    // Invalid password test case
    it('should return an error if the password is incorrect', async () => {
      const response = await request.post('/signin').send({
        email: 'test@example.com',
        password: 'incorrect_password',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe(
        'Cannot verify login information'
      );
    });
  });
});
