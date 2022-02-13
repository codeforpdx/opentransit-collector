var request = require('request');
const { DateTime } = require("luxon");

function getVehicles(config) {
    const url = config.gtfs_realtime_url;
    console.log('fetching vehicles from ' + url);
    const currentDateTime = DateTime.utc();

    var requestSettings = {
      method: 'GET',
      url: url,
      encoding: null
    };

    return new Promise((resolve, reject) => {
        request(requestSettings, function (error, response, body) {
          if (error) {
            reject(error);
          } else if (response.statusCode == 200) {
              const feed = JSON.parse(body);
              // console.log('feed', feed);
            console.log('feed.keys()', Object.keys(feed));
            const vehicles = [];
            const feedTimestamp = feed.resultSet.queryTime; // note - time is in milliseconds
            feed.resultSet.vehicle.forEach(function(vehicle) {
              const gtfsVehiclePosition = vehicle;
              if (gtfsVehiclePosition
                && gtfsVehiclePosition.tripID
                && gtfsVehiclePosition.latitude
                && gtfsVehiclePosition.longitude
                && gtfsVehiclePosition.vehicleID) {
                vehicles.push(makeVehicle(gtfsVehiclePosition, feedTimestamp));
              }
            });
            console.log('found ' + vehicles.length + ' vehicles');
            console.log('showing first vehicle:', vehicles[0]);
            resolve(vehicles);
            
          } else {
            reject(new Error("HTTP " + response.statusCode + " fetching gtfs-realtime feed from " + url));
          }
        });
    });
}

function makeVehicle(gtfsVehiclePosition, feedTimestamp) {
    // Trimet GTFS Realtime API returns vehicles like this:
    // {"expires":1644778154868
      // ,"signMessage":"Red Line to Beaverton"
      // ,"serviceDate":1644739200000
      // ,"loadPercentage":null
      // ,"latitude":45.5301092
      // ,"nextStopSeq":11
      // ,"source":"aim"
      // ,"type":"rail"
      // ,"blockID":9046
      // ,"signMessageLong":"MAX  Red Line to City Center & Beaverton"
      // ,"lastLocID":8375
      // ,"nextLocID":8376
      // ,"locationInScheduleDay":38319
      // ,"newTrip":false
      // ,"longitude":-122.6606923
      // ,"direction":1
      // ,"inCongestion":null
      // ,"routeNumber":90
      // ,"bearing":270
      // ,"garage":"ELMO"
      // ,"tripID":"11309048"
      // ,"delay":-49
      // ,"extraBlockID":null
      // ,"messageCode":1058
      // ,"lastStopSeq":10
      // ,"vehicleID":101
      // ,"time":1644777568871
      // ,"offRoute":false}

    const collectorVehicle = {
      routeId: gtfsVehiclePosition.routeNumber,
      vehicleId: gtfsVehiclePosition.vehicleID,
      latitude: Math.round(gtfsVehiclePosition.latitude*100000)/100000, // 14 digits of lat/lon precision is a bit overkill :0 https://xkcd.com/2170/
      longitude: Math.round(gtfsVehiclePosition.longitude*100000)/100000,
      heading: gtfsVehiclePosition.bearing,
      tripId: gtfsVehiclePosition.tripID,
      stopIndex: gtfsVehiclePosition.nextStopSeq, // trimet's api has nextStopSeq and lastStopSeq. Which should we use for stopIndex?
      status: gtfsVehiclePosition.messageCode, // similarly, no status field is in trimets api.
      timestamp: gtfsVehiclePosition.time, // note - time is in milliseconds
      secsSinceReport: (feedTimestamp != null && gtfsVehiclePosition.time != null) ? Math.max(0, (feedTimestamp - gtfsVehiclePosition.time)/1000) : null, // divide by 1000 to get seconds
    };

    if (gtfsVehiclePosition.type != '') {
      collectorVehicle.label = gtfsVehiclePosition.type; // making an assumption that label is the same as type. in trimet's case, type = 'rail' or 'bus'
    }

    return collectorVehicle;
}

module.exports = {
   getVehicles,
};

// results sent to S3 look like the following
// {"routeId":90
// ,"vehicleId":101
// ,"latitude":45.52027
// ,"longitude":-122.68585
// ,"heading":110
// ,"tripId":"11308855"
// ,"stopIndex":6
// ,"status":1054
// ,"timestamp":1644781249736
// ,"secsSinceReport":1.537
// ,"label":"rail"}

