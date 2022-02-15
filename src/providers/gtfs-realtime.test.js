const { getFeed } = require('./gtfs-realtime')
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var protobuf = require("protobufjs/minimal");
var enc = new TextEncoder(); // TextEncoder needed to make an UInt8Array that gtfs-realtime-bindings needs for decoding

test("normal decode should occur", () => {
    var feedBody = `agency_id,agency_name,agency_url,agency_timezone,agency_phone,agency_lang
FunBus,The Fun Bus,http://www.thefunbus.org,America/Los_Angeles,(310) 555-0222,en`
    expect(getFeed(GtfsRealtimeBindings.transit_realtime.FeedMessage, enc.encode(feedBody)));
});
