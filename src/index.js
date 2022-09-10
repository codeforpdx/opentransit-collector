require("dotenv").config();
const fs = require("fs");
const writeHelper = require("./writeHelper");
const { DateTime } = require("luxon");

const interval = 15000; // ms

const configPath = process.env.OPENTRANSIT_COLLECTOR_CONFIG_PATH;
const configJson = process.env.OPENTRANSIT_COLLECTOR_CONFIG_JSON;
const storeLocalEnv = process.env.STORE_LOCAL;

if (!configJson && !configPath) {
  throw new Error(
    "Missing OPENTRANSIT_COLLECTOR_CONFIG_JSON or OPENTRANSIT_COLLECTOR_CONFIG_PATH environment variable"
  );
}

let config;
if (configJson) {
  console.log("reading config from OPENTRANSIT_COLLECTOR_CONFIG_JSON");
  config = JSON.parse(configJson);
} else {
  console.log("reading config from " + configPath);
  config = JSON.parse(fs.readFileSync(configPath));
}

if (!config || !config.agencies || !config.agencies.length) {
  throw new Error("No agencies specified in config.");
}

if (!config.s3_bucket && !storeLocal()) {
  throw new Error("No s3_bucket specified in config.");
}

const providerNames = ["nextbus", "gtfs-realtime"];

const s3Bucket = config.s3_bucket;
console.log("S3 bucket: " + s3Bucket);

var agenciesInfo = config.agencies.map((agencyConfig) => {
  const providerName = agencyConfig.provider;
  if (!providerNames.includes(providerName)) {
    throw new Error("Invalid provider: " + providerName);
  }

  const provider = require("./providers/" + providerName);

  const agencyId = agencyConfig.id;
  if (!agencyId) {
    throw new Error("Agency missing id");
  }

  console.log("Agency: " + agencyId + " (" + providerName + ")");

  return {
    provider: provider,
    id: agencyId,
    config: agencyConfig,
  };
});

// wait until the next multiple of 15 seconds
setTimeout(function () {
  setInterval(saveVehicles, interval);
  saveVehicles();
}, interval - (Date.now() % interval));

function saveVehicles() {
  const currentDateTime = DateTime.utc();

  const promises = agenciesInfo.map((agencyInfo) => {
    return agencyInfo.provider
      .getVehicles(agencyInfo.config)
      .then((vehicles) => {
        if (storeLocal()) {
          return writeHelper.writeLocal(
            agencyInfo.id,
            currentDateTime,
            vehicles
          );
        }

        return writeHelper.writeToS3(
          s3Bucket,
          agencyInfo.id,
          currentDateTime,
          vehicles
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });

  Promise.all(promises);
}

function storeLocal() {
  return storeLocalEnv == "true";
}
