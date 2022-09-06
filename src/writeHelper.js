const AWS = require('aws-sdk');
const fs = require('fs');
var zlib = require('zlib');

const s3 = new AWS.S3();

function compressData(data) {
  return new Promise((resolve, _) => {
    return zlib.gzip(JSON.stringify(data), (_, encoded) => resolve(encoded));
  });
}

// writeLocal will perform similarly to writeToS3 except save the file locally. It won't be compressed as to
// make for easier local debugging.
function writeLocal(agency, currentDateTime, data) {
  const currentTimestamp = currentDateTime.toMillis();
  const version = "v1";
  const fileName = `/tmp/${agency}_${version}_${currentTimestamp}.json`

  return writeFile(fileName, JSON.stringify(data))
    .then((data) => {
      console.log("wrote", fileName);
      return data;
    });
}

function writeToS3(s3Bucket, agency, currentDateTime, data) {
  const currentTimestamp = currentDateTime.toMillis();
  const dateTimePathSegment = currentDateTime.toFormat('yyyy/MM/dd/HH/mm');
  const version = 'v1';
  const s3Key = `state/${version}/${agency}/${dateTimePathSegment}/${agency}_${version}_${currentTimestamp}.json.gz`;

  console.log(`writing s3://${s3Bucket}/${s3Key}`);

  return compressData(data).then(encodedData => {
    return new Promise((resolve, reject) => {
      s3.putObject({
        ACL: "public-read",
        Bucket: s3Bucket,
        Key: s3Key,
        Body: encodedData,
        ContentType: "application/json",
        ContentEncoding: "gzip",
      }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};

module.exports = {
    writeToS3,
    writeLocal
};
