# Configuring data exports

This guide explains how Spoke manages data exports and how to configure them in your installation.

## Conceptual overview

When a user requests a data export, Spoke prepares it behind the scenes. When the data is ready, it is uploaded to a cloud storage bucket (AWS's S3 or GCP's GCS). Once the exported data has been added to the bucket, Spoke sends an email notification to the user who requested the export with a link to download the data file.

To enable data exporting, you will need:

1.  To configure Spoke to send emails
2.  Access to a cloud storage service
3.  A cloud storage bucket in that account

## Setup

First, configure Spoke to send emails (see [email configuration](./HOWTO_email-configuration.md)).

### S3 setup

1.  **Create an AWS account.** If you already have an AWS account, skip this step. Otherwise, see [Amazon's documentation](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/) to create an AWS account.
1.  **Sign up for S3.** If you already have S3, skip this step. Otherwise, see [Amazon's documentation](https://docs.aws.amazon.com/AmazonS3/latest/gsg/SigningUpforS3.html) to sign up for S3 using your AWS account.
1.  **Create a S3 bucket.** If you already have an S3 bucket, skip this step. Otherwise, see [Amazon's documentation](https://docs.aws.amazon.com/AmazonS3/latest/user-guide/create-bucket.html) to create an S3 bucket. You **don't** need to enable public access to the bucket.
1.  **Configure Spoke environment variables.** In order for Spoke to connect to S3, the following environment variables must be set:
    - `EXPORT_DRIVER=s3`
    - `AWS_ACCESS_KEY_ID`
    - `AWS_S3_BUCKET_NAME`
    - `AWS_SECRET_ACCESS_KEY`

If you've reached this point in application setup, you've probably configured environment variables already. Here are [Heroku](https://devcenter.heroku.com/articles/config-vars#managing-config-vars) and [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/env_variables.html) instructions. Locally, you can use a `.env` file or the like.

### Google Cloud Storage

1.  **Create a GCP Account**
1.  **Create a GCS Bucket.**
1.  **Create a Service Account** -- Create a service account from the IAM section of GCP. You'll need to download the json key for that service account. You'll also need to grant the service account acccess to the bucket. This can be done from the GCS bucket configuration page using the service account's email address.
1.  **Configure Spoke environment variables.** In order for Spoke to connect to GCS, the following environment variables must be set:
    - `EXPORT_DRIVER=gs-json`
    - `AWS_S3_BUCKET_NAME` -- the name of the GCS bucket (ex. `exports.spokerewired.com`)
    - `GOOGLE_APPLICATION_CREDENTIALS` -- the value of the JSON keyfile for the service account.
    - (optional) `AWS_S3_KEY_PREFIX=client-one/`
