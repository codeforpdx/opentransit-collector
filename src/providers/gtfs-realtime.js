var request = require('request');
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const { reject } = require('lodash');

function getVehicles(config) {
    const url = config.gtfs_realtime_url;
    console.log('fetching vehicles from ' + url);

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
            let feed;
            try {
              feed = getFeed(GtfsRealtimeBindings.transit_realtime.FeedMessage, body);
            } catch(e) {
              reject(e);
            }
            const vehicles = [];
            const feedTimestamp = feed.header.timestamp;
            feed.entity.forEach(function(entity) {
              const gtfsVehiclePosition = entity.vehicle;
              if (gtfsVehiclePosition
                && gtfsVehiclePosition.trip
                && gtfsVehiclePosition.position
                && gtfsVehiclePosition.vehicle) {
                vehicles.push(makeVehicle(gtfsVehiclePosition, feedTimestamp));
              }
            });
            resolve(vehicles);
          } else {
            reject(new Error("HTTP " + response.statusCode + " fetching gtfs-realtime feed from " + url));
          }
        });
    });
}

// getFeed contains logic for decoding a gtfs payload and any error handling
// decoder param should be of type GtfsRealtimeBindings.transit_realtime.FeedMessage
function getFeed(decoder, body) {
  let feed; 
  try {
    feed = decoder.decode(body);
  } catch (e) {
    throw new Error("error parsing gtfs feed: " + e);
  }

  return feed;
}

function makeVehicle(gtfsVehiclePosition, feedTimestamp) {
    // GTFS-Realtime API returns vehicles like this:
    // VehiclePosition {
    //   trip: TripDescriptor { tripId: '9420711', routeId: '190' },
    //   position:
    //    Position {
    //      latitude: 45.52998733520508,
    //      longitude: -122.66744232177734,
    //      bearing: 121 },
    //   currentStopSequence: 10,
    //   currentStatus: 1,
    //   timestamp: 1571000916,
    //   stopId: '11507',
    //   vehicle: VehicleDescriptor { id: '230', label: 'Yellow Line to City Ctr/Milw' } }

    const {
      trip,
      position,
      stopId,
      vehicle,
      timestamp,
      currentStopSequence,
      currentStatus,
    } = gtfsVehiclePosition;

    const collectorVehicle = {
      routeId: trip.routeId,
      vehicleId: vehicle.id,
      latitude: Math.round(position.latitude*100000)/100000, // 14 digits of lat/lon precision is a bit overkill :0 https://xkcd.com/2170/
      longitude: Math.round(position.longitude*100000)/100000,
      heading: position.bearing,
      tripId: trip.tripId,
      stopIndex: currentStopSequence,
      status: currentStatus,
      secsSinceReport: (feedTimestamp != null && timestamp != null) ? Math.max(0, feedTimestamp - timestamp) : null,
    };

    if (stopId != '') {
      collectorVehicle.stopId = stopId;
    }
    if (vehicle.label != '') {
      collectorVehicle.label = vehicle.label;
    }

    return collectorVehicle;
}

module.exports = {
   getVehicles,
   getFeed,
};
