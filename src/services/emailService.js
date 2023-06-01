import formData from 'form-data';
import Mailgun from 'mailgun.js';
import config from '../config.js';
import validator from 'validator';

const { DOMAIN } = config;
const mailgun = new Mailgun(formData);
const client = mailgun.client({
  username: config.EMAIL_USERNAME,
  key: config.EMAIL_KEY,
});

async function sendTextEmail({
  from = 'hello@connectorlando.tech',
  to,
  subject,
  text,
}) {
  if (
    validator.isEmail(from) &&
    to &&
    validator.isEmail(to) &&
    subject &&
    text
  ) {
    try {
      await client.messages.create(DOMAIN, {
        from,
        to,
        subject,
        text,
      });
    } catch (error) {
      throw new Error(error);
    }
  } else {
    var errorString = 'emailService requires a valid: \n';
    if (!from || !validator.isEmail(from)) {
      errorString += '- from\n';
    }
    if (!to || !validator.isEmail(to)) {
      errorString += '- to\n';
    }
    if (!subject) {
      errorString += '- subject\n';
    }
    if (!text) {
      errorString += '- text\n';
    }
    throw new Error(errorString);
  }
}

async function sendHtmlEmail({
  from = 'hello@connectorlando.tech',
  to,
  subject,
  html,
}) {
  if (
    validator.isEmail(from) &&
    to &&
    validator.isEmail(to) &&
    subject &&
    html
  ) {
    try {
      await client.messages.create(DOMAIN, {
        from,
        to,
        subject,
        html,
      });
    } catch (error) {
      throw new Error(error);
    }
  } else {
    var errorString = 'emailService requires a valid: \n';
    if (!from || !validator.isEmail(from)) {
      errorString += '- from\n';
    }
    if (!to || !validator.isEmail(to)) {
      errorString += '- to\n';
    }
    if (!subject) {
      errorString += '- subject\n';
    }
    if (!html) {
      errorString += '- html\n';
    }
    throw new Error(errorString);
  }
}

export default {
  sendTextEmail,
  sendHtmlEmail,
};
