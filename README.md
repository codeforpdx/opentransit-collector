## OpenTransit Collector

Fetches transit data (realtime vehicle locations) and saves it to S3

## Usage

OpenTransit Collector is configured via JSON stored in the `OPENTRANSIT_COLLECTOR_CONFIG_JSON` environment variable, or a file located at the path in the `OPENTRANSIT_COLLECTOR_CONFIG_PATH` environment variable.

The config JSON should be an object containing the following properties:

`s3_bucket` - The name of the S3 bucket where transit data will be written.

`agencies` - An array containing an object for each transit agency. Each object in the agencies array should have the following properties:
* `id` - The ID of the transit agency, which will appear in the S3 keys written to the S3 bucket.
* `provider` - The module name in the providers directory (e.g. 'nextbus') which provides an API for real-time vehicle locations.
* Any custom properties specific to the provider, prefixed by the provider name (e.g. IDs or API keys)

OpenTransit Collector writes data to S3 using the AWS credentials from the default locations, e.g. a credentials file located within the Docker container at /root/.aws/credentials (using the default profile or a profile named by AWS_PROFILE), or using the environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.

In a development environment, you can set environment variables and AWS credentials by creating a file in the root of this repository named docker-compose.override.yml, e.g.:

```
version: "3.7"
services:
  collector-dev:
    volumes:
      - ../.aws:/root/.aws
    environment:
      AWS_PROFILE: "default"
      OPENTRANSIT_COLLECTOR_CONFIG_JSON: >
        {
         "s3_bucket": "my-opentransit-bucket",
         "agencies": [
           {
             "id": "muni",
             "provider": "nextbus",
             "nextbus_agency_id": "sf-muni"
           },
           {
             "id": "ttc",
             "provider": "nextbus",
             "nextbus_agency_id": "ttc"
           },
           {
             "id": "marin",
             "provider": "marin"
           }
         ]
        }
```

To test, run `docker-compose up`.

## Prerequisites

Docker
