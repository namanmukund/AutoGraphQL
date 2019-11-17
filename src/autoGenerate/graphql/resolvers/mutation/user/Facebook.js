import { keys } from 'lodash';

const https = require('https');

const FACEBOOK_APP_ID = '445052406249127';
const FACEBOOK_APP_SECRET = '593dd9fd835a40603332d4a5db2306db';
class Facebook {
  constructor() {
    this.version = 'v2.9';
    this.credentials = {
      appId: process.env.FACEBOOK_APP_ID || FACEBOOK_APP_ID,
      secret: process.env.FACEBOOK_APP_SECRET || FACEBOOK_APP_SECRET,
    };

    this.redirectUrl = process.env.FACEBOOK_REDIRECT_URL || 'http://localhost:3000/facebook-callback';
  }

  call(method, params = {}) {
    return new Promise((resolve, reject) => {
      let url = `https://graph.facebook.com/${this.version}/${method}?client_id=${this.credentials.appId}&redirect_uri=${encodeURIComponent(this.redirectUrl)}&client_secret=${encodeURIComponent(this.credentials.secret)}`;
      keys(params).forEach((key) => {
        url += `&${key}=${encodeURIComponent(params[key])}`;
      });
      https.get(url, (res) => {
        let data = '';

        res.on('data', (d) => {
          data += d;
        });

        res.on('end', () => {
          data = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(data);
          } else {
            resolve(data);
          }
        });
      });
    });
  }
}

export default Facebook;
