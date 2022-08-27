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

## Local Usage 
We have the option of writing the JSON response data from the providers locally instead of storing it to S3. If you're developing locally and need to test, this is preferable as to avoid writing too much
similar data to S3.

Instead of the above docker-compose file, run this instead:
```
docker-compose -f local-docker-compose.yml up
```

This command will start a docker container called `local-collector-dev`. You can verify the container is running by starting a new terminal, changing directories to this repo, and then running:
```
docker ps
```
You should see something like this (below) with `local-collector-dev` under `NAMES`:
```
CONTAINER ID   IMAGE                                 COMMAND           CREATED         STATUS         PORTS     NAMES
9a05f60162de   opentransit-collector_collector-dev   "npm run start"   5 minutes ago   Up 8 seconds             local-collector-dev
```

**Caveat**: The local process will store the json responses in the docker container in the `/tmp` directory. It's an annoyance but you can copy the files locally with the following command.
```
docker cp local-collector-dev:/tmp .
```
The `local-collector-dev:/tmp` is the "source" to be copied and the `.` is the "destination". In this case, `.` means "current directory". If you want to change the destination, feel free to change the destination. 

Note that `tmp/*` has been added to the `.gitignore` file.

## Unit Tests

We use the Jest unit testing framework for some simple testing. To run the unit tests, run the following command at the root of the repo:

```
docker build -t opentransit-collector .
docker run opentransit-collector npm run test
```

## Prerequisites

Docker
