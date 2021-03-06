const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env'),
});

module.exports = {
  name: 'Yeep Dev',
  baseUrl: process.env.BASE_URL,
  port: 5000,
  session: {
    lifetimeInSeconds: 30 * 24 * 60 * 60, // i.e. 30 days
    cookie: {
      secret: process.env.COOKIE_SECRET,
      isAutoRenewEnabled: true,
      expiresInSeconds: 900, // i.e. 15 mins
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
    bearer: {
      secret: process.env.BEARER_SECRET,
      expiresInSeconds: 900, // i.e. 15 mins
    },
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
    transport: 'debug',
  },
  isUsernameEnabled: true,
  isOrgCreationOpen: true,
};
