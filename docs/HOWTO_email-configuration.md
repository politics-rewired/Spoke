# Configuring email notifications

This guide explains how to configure Spoke to send email notifications. Email notifications are sent for account-related actions, to remind texters when they have messages to send and for data exports. See [Data Exporting doc](./DATA_EXPORTING.md) in the /docs folder regarding setting up an AWS S3 'bucket' to receive exports.

If you host Spoke on AWS Lambda or your own server, you will need an SMTP server configured to send email. Follow the [external SMTP server setup steps](#external-smtp-server-setup).

## External SMTP server setup

Spoke requires the following environment variables to be set to send email:

- `EMAIL_FROM`
- `EMAIL_HOST`
- `EMAIL_HOST_PASSWORD`
- `EMAIL_HOST_PORT`
- `EMAIL_HOST_USER`

See the [environment variables reference document](REFERENCE-environment_variables.md) for more information.
