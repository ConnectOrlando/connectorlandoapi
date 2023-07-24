// These imports are generally required for all route tests. I'll explain each.
// I don't this it's necessary to know these deeply. Let's learn by doing.

// supertest is a library that allows us to make requests to our express app.
import supertest from 'supertest';
// app is our express app. We'll use this to make requests.
import app from '../../src/app.js';
// prisma is our database client. We'll use this to create test data.
import prisma from '../../src/tools/prisma.js';
import bcrypt from 'bcrypt';
// request is a supertest instance. We'll use this to make requests.
const request = supertest(app);

// each test file should have a describe block. This is a way to group tests.
describe('Business Routes', () => {
  // each test should have a describe block. This is a way to group each case.
  describe('GET /business/:id', () => {
    // each test should have an it block, describing what is being tested.
    it('should retrieve a business', async () => {
      // create a fake business in the database
      const business = await prisma.business.create({
        data: {
          name: 'Test Business',
          type: 'Test Type',
          mission: 'Test Mission',
        },
      });

      // make a request to the endpoint with the id of the business we created
      const response = await request.get(`/business/${business.id}`);
      // assert that the response is what we expect
      expect(response.status).toBe(200);
      // assert that the response body is what we expect
      expect(response.body.business).toBeInstanceOf(Object);
    });

    // this is an example of a failure test case
    it('should return not found error', async () => {
      // make a request to the endpoint with an id that doesn't exist
      const response = await request.get('/business/100');
      // assert that the response contains the correct error message
      expect(response.body.error.message).toBe(
        'Could not find business with id 100'
      );
    });

    it('should return archived error', async () => {
      // create a fake archived business in the database
      const business = await prisma.business.create({
        data: {
          name: 'Test Business',
          type: 'Test Type',
          mission: 'Test Mission',
          isArchived: true,
        },
      });

      const response = await request.get(`/business/${business.id}`);
      expect(response.body.error.message).toBe(
        'Business account already deleted'
      );
    });
  });

  describe('POST /business', () => {
    it('should create a business', async () => {
      // this allows us to send a request with a body
      const response = await request.post('/business').send({
        name: 'Test Business',
        type: 'Test Type',
        mission: 'Test Mission',
      });
      expect(response.status).toBe(200);
      expect(response.body.business).toBeInstanceOf(Object);
    });

    it('should require a name', async () => {
      const response = await request.post('/business').send({
        type: 'Test Type',
        mission: 'Test Mission',
      });
      expect(response.body.error.message).toBe(
        'Must provide a valid name, type, and mission'
      );
    });

    it('should require a type', async () => {
      const response = await request.post('/business').send({
        name: 'Test Business',
        mission: 'Test Mission',
      });
      expect(response.body.error.message).toBe(
        'Must provide a valid name, type, and mission'
      );
    });

    it('should require a mission', async () => {
      const response = await request.post('/business').send({
        name: 'Test Business',
        type: 'Test Type',
      });
      expect(response.body.error.message).toBe(
        'Must provide a valid name, type, and mission'
      );
    });
  });
});
describe('Auth Routes', () => {
  describe('POST /auth/signup', () => {
    it('should create user account', async () => {
      const response = await request.post('/auth/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test Password',
      });
      expect(response.status).toBe(200);
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('should require a name', async () => {
      const response = await request.post('/auth/signup').send({
        email: 'test@example.com',
        password: 'Test Password',
      });
      expect(response.body.error.message).toBe('Must provide a valid name');
    });

    it('should require a email', async () => {
      const response = await request.post('/auth/signup').send({
        name: 'Test User',
        password: 'Test Password',
      });
      expect(response.body.error.message).toBe('Must provide a valid email');
    });

    it('should require a password', async () => {
      const response = await request.post('/auth/signup').send({
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(response.body.error.message).toBe('Must provide a valid password');
    });

    it('should expect a valid email', async () => {
      const response = await request.post('/auth/signup').send({
        name: 'Test User',
        email: '123',
        password: 'Test Password',
      });
      expect(response.body.error.message).toBe('Must provide a valid email');
    });

    it('should require unused email', async () => {
      await prisma.user.create({
        data: {
          name: 'test user',
          email: 'test@example.com',
          password: 'test password',
        },
      });

      const response = await request.post('/auth/signup').send({
        name: 'test user',
        email: 'test@example.com',
        password: 'test password',
      });
      expect(response.body.error.message).toBe(
        'An account with that email already exists'
      );
    });

    it('should be case insensitive', async () => {
      await prisma.user.create({
        data: {
          name: 'test user',
          email: 'test@example.com',
          password: 'test password',
        },
      });

      const response = await request.post('/auth/signup').send({
        name: 'test user',
        email: 'tESt@example.com',
        password: 'test password',
      });
      expect(response.body.error.message).toBe(
        'An account with that email already exists'
      );
    });

    it('should allow .edu emails', async () => {
      const response = await request.post('/auth/signup').send({
        name: 'test user',
        email: 'test@example.edu',
        password: 'test password',
      });
      expect(response.status).toBe(200);
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('should allow .tech emails', async () => {
      const response = await request.post('/auth/signup').send({
        name: 'test user',
        email: 'test@example.tech',
        password: 'test password',
      });
      expect(response.status).toBe(200);
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });
  });

  describe('POST /signin', () => {
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

    // Success test case
    it('should sign in a user with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      await prisma.user.create({
        data: {
          name: 'name',
          email: 'realemail@gmail.com',
          password: passwordHash,
        },
      });
      const response = await request.post('/auth/signin').send({
        email: 'realemail@gmail.com',
        password: 'password',
      });

      expect(response.status).toBe(200);
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    // Email test case
    it('should return an error if email is not provided', async () => {
      const response = await request.post('/auth/signin').send({
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'Must provide a valid email and password'
      );
    });

    // Password test case
    it('should return an error if password is not provided', async () => {
      const response = await request.post('/auth/signin').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'Must provide a valid email and password'
      );
    });

    // User does not exist test case
    it('should return an error if the user does not exist', async () => {
      const response = await request.post('/auth/signin').send({
        email: 'nonexistent@example.com',
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Account does not exist');
    });

    // Invalid password test case
    it('should return an error if the password is incorrect', async () => {
      const response = await request.post('/auth/signin').send({
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
