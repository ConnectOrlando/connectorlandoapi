//import authTypes from '../../src/constants/authTypes.js';
//import TokenService from '../../src/services/tokenService.js';
//import jwt from '../../src/tools/jwt.js';
//import prisma from '../../src/tools/prisma.js';
//import emailService from '../services/emailService.js';

jest.mock('mailgun.js', () => {
  const createMailgunInstance = jest.fn().mockReturnValue({
    messages: {
      create: jest.fn().mockResolvedValue({}),
    },
  });
  return jest.fn().mockReturnValue({ client: createMailgunInstance });
});

describe('EmailService', () => {
  beforeEach(() => {
    delete global.EMAIL_CLIENT;
  });

  describe('sendTextEmail', () => {
    it('should send a text email', async () => {
      const to = 'recipient@example.com';
      const subject = 'Test Subject';
      const text = 'This is the email content';
      //const response = await emailService.sendTextEmail({ to, subject, text });

      // expect(response).toBeUndefined();
      expect(global.EMAIL_CLIENT.messages.create).toHaveBeenCalledTimes(1);
      expect(global.EMAIL_CLIENT.messages.create).toHaveBeenCalledWith(
        //config.DOMAIN,
        {
          from: 'hello@connectorlando.tech',
          to,
          subject,
          text,
        }
      );
    });

    // I am unsure on how to create tests for invalid email
  });

  describe('sendHtmlEmail', () => {
    it('should send an HTML email', async () => {
      const to = 'recipient@example.com';
      const subject = 'Test Subject';
      const html = '<p>This is the email content in HTML format</p>';
      //const response = await emailService.sendHtmlEmail({ to, subject, html });

      //expect(response).toBeUndefined();
      expect(global.EMAIL_CLIENT.messages.create).toHaveBeenCalledTimes(1);
      expect(global.EMAIL_CLIENT.messages.create).toHaveBeenCalledWith(
        //config.DOMAIN,
        {
          from: 'hello@connectorlando.tech',
          to,
          subject,
          html,
        }
      );
    });
  });
});
