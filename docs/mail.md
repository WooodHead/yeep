## Configuring the mail client

Adding configuration options for the email service is required.
We are using [nodemailer](https://nodemailer.com) v4+ under the hood so we will be supporting a bunch of different options out of the box. We currently support

- SMTP
- Amazon SES
- Sendgrid
- Mailgun
- Debug

An example object of the mail configuration as needed in the yeep.config.js file is

```js
{
  transport: 'smtp',
  from: 'admin@yeep.com',
  // or you can use this format
  // from: "'Custom Name' <myemail@address.com>",
  templatePath: './path/to/email/templates' // if you want to provide custom email templates
  options: {
    // All options added here will be passed as arguments to the nodemailer createTransport function.
  }
}
```

> All options added here will be passed as arguments to the nodemailer createTransport function.

### Debug

For development purposes we have included a `debug` option where all the emails will be printed to the console.

An example configuration would be

```js
{
  transport: 'debug',
  from: 'admin@yeep.com',
}
```

### SMTP

An example configuration for SMTP usage

```js
{
  transport: 'smtp',
  from: 'admin@yeep.com',
  options: {
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.MAIL_AUTH_USERNAME,
      pass: process.env.MAIL_AUTH_PASSWORD,
    },
  }
}
```

### SES

The SES transport requires these options that will need to be present in the relevant `option` property of the mail option in your `yeep.config` file

```js
{
  transport: 'ses',
  from: 'admin@yeep.com',
  options: {
    apiVersion: '2010-12-01',
    accessKeyId: 'Your-Access-key',
    secretAccessKey: 'Your-Access-secret-key',
    region: 'your-region',
  }
}
```

### Mailgun

As before, mailgun will need this configuration to run properly.

> You can always use the SMTP options to run mailgun through SMTP instead of its API

```js
{
  transport: 'mailgun',
  from: 'admin@yeep.com',
  options: {
    auth: {
      api_key: 'key-1234123412341234',
      domain: 'sandbox3249234.mailgun.org'
    },
  }
}
```

### Sendgrid

As before, sendgrid will need this configuration to run properly.

> You can always use the SMTP options to run sendgrid through SMTP instead of its API

```js
{
  transport: 'sendgrid',
  from: 'admin@yeep.com',
  options: {
    auth: {
      api_key: 'your-api-key',
    },
  }
}
```

### Customizing the theme of the emails

You can provide a `templatePath` property to your email configuration object. This should point to a folder containing these templates

| Template Name          | Description                                                                          | Arguments                                                           |
| :--------------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| passwordResetInit.html | This is the template that will be send whenever a user requests for a password reset | <% url %> (contains the url the user will follow to reset the link) |
