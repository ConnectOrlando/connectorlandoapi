import supertest from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/tools/prisma.js';
import { jest } from '@jest/globals';

const request = supertest(app);

describe('Auth Routes', () => {
  describe('POST /auth/signup', () => {
    it('should create user account', async () => {
      jest.mock('../../src/services/emailService.js', () => ({
        sendHtmlEmail: () => true,
      }));

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
});
