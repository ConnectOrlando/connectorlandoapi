import supertest from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/tools/prisma.js';
import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import emailService from '../../src/services/emailService.js';

const request = supertest(app);

beforeEach(() => {
  // this mocks the sendHtmlEmail function so that it does not actually send an email
  emailService.sendHtmlEmail = jest.fn(() => true);
});

afterEach(() => {
  // this clears the mock after each test so that it does not interfere with other tests
  // for example, if you have a test that checks how many times a function was called
  // and you don't clear the mock, it will interfere with the next test
  // because the mock will still have the number of times it was called from the previous test
  jest.clearAllMocks();
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
      expect(emailService.sendHtmlEmail).toHaveBeenCalled();
      // This checks that the function was called with an object containing the following properties
      expect(emailService.sendHtmlEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          html: expect.any(String),
          subject: expect.any(String),
        })
      );
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

  describe('POST /auth/signin', () => {
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

    it('should return an error if email is not provided', async () => {
      const response = await request.post('/auth/signin').send({
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'Must provide a valid email and password'
      );
    });

    it('should return an error if password is not provided', async () => {
      const response = await request.post('/auth/signin').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'Must provide a valid email and password'
      );
    });

    it('should return an error if the user does not exist', async () => {
      const response = await request.post('/auth/signin').send({
        email: 'nonexistent@example.com',
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'Cannot verify user information'
      );
    });

    it('should return an error if the password is incorrect', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: passwordHash,
        },
      });

      const response = await request.post('/auth/signin').send({
        email: 'test@example.com',
        password: 'incorrect_password',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe(
        'Cannot verify login information'
      );
    });

    it('should return an error if email is not a valid email string', async () => {
      const response = await request.post('/auth/signin').send({
        email: 'invalid_email',
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'Cannot verify user information'
      );
    });
  });
});
