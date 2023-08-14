import supertest from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/tools/prisma.js';
import bcrypt from 'bcrypt';
import jwt from '../../src/tools/jwt.js';
const request = supertest(app);

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
});

describe('POST /auth/reset-password', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testPassword',
  };
  it('should reset the password successfully', async () => {
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        password: hashedPassword,
      },
    });
    const token = jwt.sign({ email: testUser.email }, '1w');

    const response = await request
      .post('/auth/reset-password')
      .send({ resetPasswordToken: token, newPassword: 'newTestPassword' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password reset successful');

    const updatedUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
    const passwordsMatch = await bcrypt.compare(
      'newTestPassword',
      updatedUser.password
    );
    expect(passwordsMatch).toBe(true);
  });

  it('should return error message for invalid token', async () => {
    const invalidToken = 'invalid-token';

    const response = await request.post('/auth/reset-password').send({
      resetPasswordToken: invalidToken,
      newPassword: 'newTestPassword',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(
      'Reset token is invalid or has expired. Please request a new one.'
    );
  });

  it('should return "User not found" error for non-existing user', async () => {
    const token = jwt.sign({ email: 'nonexisting@example.com' }, '1w');
    const response = await request
      .post('/auth/reset-password')
      .send({ resetPasswordToken: token, newPassword: 'newTestPassword' });
    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('User not found');
  });
});
