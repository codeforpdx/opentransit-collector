const AWS = require('aws-sdk');
var zlib = require('zlib');

const s3 = new AWS.S3();

function compressData(data) {
  return new Promise((resolve, _) => {
    return zlib.gzip(JSON.stringify(data), (_, encoded) => resolve(encoded));
  });
}

function writeToS3(s3Bucket, agency, currentDateTime, data) {
  const currentTimestamp = currentDateTime.toMillis();
  const dateTimePathSegment = currentDateTime.toFormat('yyyy/MM/dd/HH/mm');
  const s3Key = `${agency}/${dateTimePathSegment}/${agency}-${currentTimestamp}.json.gz`;

  console.log(`writing s3://${s3Bucket}/${s3Key}`);

  return compressData(data).then(encodedData => {
    return new Promise((resolve, reject) => {
      s3.putObject({
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
    writeToS3
};