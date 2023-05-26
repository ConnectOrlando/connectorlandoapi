import formData from 'form-data';
import Mailgun from 'mailgun.js';

const DOMAIN = 'api.connectorlando.tech';
const mailgun = new Mailgun(formData);
const client = mailgun.client({
  username: 'api',
  key: 'key-be435e340c2674abc7d433862acbe740',
});

function sendTextEmail({ from, to, subject = 'ConnectOrlando', text }) {
  client.messages
    .create(DOMAIN, { from, to, subject, text })
    .then(res => {
      console.log(res);
    })
    .catch(error => {
      console.log(error);
    });
}

function sendHtmlEmail({ from, to, subject = 'ConnectOrlando', html }) {
  client.messages
    .create(DOMAIN, { from, to, subject, html })
    .then(res => {
      console.log(res);
    })
    .catch(error => {
      console.log(error);
    });
}

export default {
  sendTextEmail,
  sendHtmlEmail,
};
