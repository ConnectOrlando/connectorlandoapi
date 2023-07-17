import formData from 'form-data';
import Mailgun from 'mailgun.js';
import config from '../config.js';
import validator from 'validator';
import Logger from '../tools/logger.js';

let EMAIL_CLIENT;
if (!config.EMAIL_USERNAME || !config.EMAIL_KEY || !config.DOMAIN) {
  Logger.error(
    `EmailService - the following environment variables are required:
     - EMAIL_USERNAME
     - EMAIL_KEY
     - DOMAIN
    You can run the API without this but you will not be able to send emails.`
  );
}

function ensureClientExists() {
  if (!EMAIL_CLIENT) {
    EMAIL_CLIENT = new Mailgun(formData)?.client({
      username: config.EMAIL_USERNAME,
      key: config.EMAIL_KEY,
    });
  }
}

async function sendTextEmail({
  from = 'hello@connectorlando.tech',
  to,
  subject,
  text,
}) {
  ensureClientExists();
  if (!validator.isEmail(to)) {
    throw new Error('emailService requires a valid to');
  } else if (!validator.isEmail(from)) {
    throw new Error('emailService requires a valid from');
  } else if (!subject) {
    throw new Error('emailService requires a valid subject');
  } else if (!text) {
    throw new Error('emailService requires a valid text');
  }

  await EMAIL_CLIENT.messages.create(config.DOMAIN, {
    from,
    to,
    subject,
    text,
  });
}

async function sendHtmlEmail({
  from = 'hello@connectorlando.tech',
  to,
  subject,
  html,
}) {
  ensureClientExists();
  if (!validator.isEmail(to)) {
    throw new Error('emailService requires a valid to');
  } else if (!validator.isEmail(from)) {
    throw new Error('emailService requires a valid from');
  } else if (!subject) {
    throw new Error('emailService requires a valid subject');
  } else if (!html) {
    throw new Error('emailService requires a valid html');
  }

  await EMAIL_CLIENT.messages.create(config.DOMAIN, {
    from,
    to,
    subject,
    html,
  });
}

export default {
  sendTextEmail,
  sendHtmlEmail,
};
