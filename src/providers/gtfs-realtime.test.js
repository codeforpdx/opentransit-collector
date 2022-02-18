const { getFeed } = require('./gtfs-realtime')
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var fm = GtfsRealtimeBindings.transit_realtime.FeedMessage; 
var fs = require('fs');
const { fail } = require('assert');

test("normal decode should occur", () => {
    let data;
    try {
        data = fs.readFileSync("./src/providers/test_data/valid_feed_data.pb");
    } catch (e) {
        fail(e);
    }
    expect(() => { getFeed(fm, data) }).toEqual(expect.anything());
    expect(() => { getFeed(fm, data) }).not.toThrow();
});

test("should throw an error on bad data", () => {
    let data;
    try {
        data = fs.readFileSync("./src/providers/test_data/invalid_feed_data.pb");
    } catch (e) {
        fail(e);
    }

    expect(() => { getFeed(fm, data) }).toThrow("error parsing gtfs feed");
});