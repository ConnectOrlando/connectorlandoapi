import supertest from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/tools/prisma.js';
import bcrypt from 'bcrypt';
import jwt from '../../src/tools/jwt.js';
import { getSignedRefreshToken } from '../../src/services/tokenService.js';
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
    describe('POST /auth/signout', () => {
      it('should sign out successfully with a valid refresh token', async () => {
        const user = await prisma.user.create({
          data: {
            name: 'logout user',
            email: 'logout@example.com',
            password: await bcrypt.hash('testPassword', 10),
          },
        });

        const refreshToken = await getSignedRefreshToken({
          request: {
            headers: {
              'x-forwarded-for': '123.45.67.89',
              'user-agent': 'jest-agent',
            },
          },
          user,
        });

        const response = await request
          .post('/auth/signout')
          .send({ refreshToken });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Successfully logged out');
        const refreshTokenInfo = await jwt.verify(refreshToken);

        const checkToken = await prisma.refreshTokens.findUnique({
          where: {
            id: refreshTokenInfo.refreshTokenId,
          },
        });
        expect(checkToken).toBe(null);
      });

      it('should log out successfully even with an invalid refresh token', async () => {
        const invalidToken = 'invalid-refresh-token';

        const response = await request
          .post('/auth/signout')
          .send({ refreshToken: invalidToken });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Successfully logged out');
      });

      it('should log out successfully even without providing a refresh token', async () => {
        const response = await request.post('/auth/signout').send({});
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Successfully logged out');
      });
    });

    describe('POST /auth/forgot-password', () => {
      it('should send a password reset email for a valid email', async () => {
        const userEmail = 'testuser1@example.com';

        const response = await request
          .post('/auth/forgot-password')
          .send({ email: userEmail });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe(
          'Password reset request has been processed.'
        );
      });

      it('should return an error for missing email', async () => {
        const response = await request.post('/auth/forgot-password').send({});

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe('Must provide a valid email');
      });

      it('should return a message for non-existing email', async () => {
        const nonExistingEmail = 'nonexistent@example.com';
        const response = await request
          .post('/auth/forgot-password')
          .send({ email: nonExistingEmail });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe(
          'Password reset request has been processed.'
        );
      });
    });
  });
});

describe('POST /auth/reset-password', () => {
  const randomUser = {
    email: 'randomtest@example.com',
    password: 'testPassword',
  };
  it('should reset the password successfully', async () => {
    const hashedPassword = await bcrypt.hash(randomUser.password, 10);
    const user = await prisma.user.create({
      data: {
        email: randomUser.email,
        password: hashedPassword,
      },
    });
    const token = jwt.sign({ email: randomUser.email }, '1w');

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
