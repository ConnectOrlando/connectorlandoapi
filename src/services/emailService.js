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
  if (!validator.isEmail(to)) {
    throw new Error('emailService requires a valid to');
  } else if (!validator.isEmail(from)) {
    throw new Error('emailService requires a valid from');
  } else if (!subject) {
    throw new Error('emailService requires a valid subject');
  } else if (!text) {
    throw new Error('emailService requires a valid text');
  }

  await client.messages.create(DOMAIN, {
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
  if (!validator.isEmail(to)) {
    throw new Error('emailService requires a valid to');
  } else if (!validator.isEmail(from)) {
    throw new Error('emailService requires a valid from');
  } else if (!subject) {
    throw new Error('emailService requires a valid subject');
  } else if (!html) {
    throw new Error('emailService requires a valid html');
  }

  await client.messages.create(DOMAIN, {
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
