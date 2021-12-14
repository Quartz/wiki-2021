# wikipedia

Year end piece showing all the wikipedia articles from the year


## Testing and Deployments

Full documentation of the Things testing and deployment process is [here](https://github.com/Quartz/slush-qz-thing).

In summary

* If you cloned this repo (rather than generating it via the template script) you'll need to install libraries via `npm install`
* You can test locally by running `gulp`. That will start a live-updating test server.
* Deploy by running `gulp -b push`. That will bundle the project, move files to the `qz-thing` repo and our S3 bucket.

This repository is setup for continuous deployment through the [qz-things](https://github.com/Quartz/qz-things) repo.

You can see the status of the deployments via messages from `qzbot` in the `deployments` Slack channel. Deployment includes purging of the caching layer, so there is no need to do this manually.

## Assets

In order to ensure that deployments are fast and that the AWS CodePipeline can fetch this repository, large assets such as images, videos, and fonts or directories full of hundreds of files should not be put into the `/assets` folder. Instead, those should be placed in the `aws-assets` folder.

Files in the `aws-assets` folder will be placed into a a separate environment (https://things-assets.qz.com).

You need to configure the AWS command line interface for this

1. Install the AWS CLI (https://docs.aws.amazon.com/cli/latest/userguide/install-macos.html)
2. Configure the AWS CLI (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
