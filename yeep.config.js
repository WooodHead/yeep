const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env'),
});

module.exports = {
  name: 'Yeep Dev',
  baseUrl: process.env.BASE_URL,
  port: 5000,
  accessToken: {
    type: 'hmac',
    secret: process.env.JWT_SECRET,
    lifetimeInSeconds: 300, // i.e. 5 mins
  },
  refreshToken: {
    lifetimeInSeconds: 3 * 24 * 60 * 60, // i.e. 3 days
  },
  cookie: {
    secret: process.env.COOKIE_SECRET,
    lifetimeInSeconds: 30 * 24 * 60 * 60, // i.e. 30 days
    isAutoRenewEnabled: true,
    renewIntervalInSeconds: 900, // i.e. 15 mins
    domain: (request) => {
      if (process.env.NODE_ENV !== 'production') {
        return request.hostname;
      }

      return '.yeep.io';
    },
    path: '/',
    httpOnly: true,
    secure: () => process.env.NODE_ENV === 'production',
  },
  mongo: {
    uri: process.env.MONGODB_URI,
    migrationDir: 'migrations/',
  },
  storage: {
    type: 'fs',
    uploadDir: 'uploads/',
  },
  htmlTemplates: {
    emailVerificationSuccess: path.resolve(__dirname, 'server/views/emailVerificationSuccess.html'),
    emailVerificationError: path.resolve(__dirname, 'server/views/emailVerificationError.html'),
  },
  mail: {
    templates: {
      passwordReset: path.resolve(__dirname, 'server/views/passwordResetInit.html'),
      emailVerification: path.resolve(__dirname, 'server/views/emailVerification.html'),
    },
  },
  isUsernameEnabled: true,
  isOrgCreationOpen: true,
};
