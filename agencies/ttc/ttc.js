const axios = require('axios');
const addVehiclesToCassandra = require('../../vehicleUpdater');
const config = require('../../config');
const ttcConfig = require('./ttcConfig');

/*
 * TTC uses the NextBus API
 * We use our version of Restbus, which gets all the vehicles
 * https://github.com/trynmaps/restbus
 * 
 * A lot of this code is similar to the one used in Muni.js
 * See https://github.com/trynmaps/orion/issues/8 
 * 
 */

function updateTtcVehicles() {
  return axios.get('/agencies/ttc/vehicles', {
    baseURL: config.restbusURL
  })
    .then((response) => {
      const vehicles = response.data;
      console.log(vehicles);
      return vehicles.map(makeOrionVehicleFromNextbus);
    })
    .then((vehicles) => {
      return addVehiclesToCassandra(
        vehicles,
        ttcConfig.keyspace,
        ttcConfig.vehicleTable,
      );
    })
    .catch((error) => {
      console.log(error);
    });
}

function makeOrionVehicleFromNextbus(nextbusObject) {
  const { id, routeId, lat, lon, heading } = nextbusObject;
  return {
    rid: routeId,
    vid: id,
    lat,
    lon,
    heading,
  };
}

module.exports = updateTtcVehicles;
