var sha256 = require('crypto-js/sha256');
var hmacSha256 = require('crypto-js/hmac-sha256');

var accessKey = null
var secretKey = null

/*
   Documentation:
   https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
*/

function getSignatureKey(key, dateStamp, regionName, serviceName) {
    var keyDate = hmacSha256(dateStamp, "AWS4" + key);
    var keyRegion = hmacSha256(regionName, keyDate);
    var keyService = hmacSha256(serviceName, keyRegion);
    var keySigning = hmacSha256("aws4_request", keyService)
    return keySigning;
}

function signAndSendRequest(region, method, bucket, path, body) {

    const amzdate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
    const datestamp = amzdate.slice(0, 8)

    const service = 's3';
    const host = `${bucket}.${service}.${region}.amazonaws.com`;

    path = path.split('/').map((part) => encodeURIComponent(part)).join('/')

    const endpoint = `https://${host}${path}`;

    const canonicalUri = path;
    const canonicalQuerystring = '';
    const payloadHash = sha256(body).toString();
    const canonicalHeaders = `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzdate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const algorithm = 'AWS4-HMAC-SHA256';

    const canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + payloadHash;

    const credentialScope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';
    const stringToSign = algorithm + '\n' +  amzdate + '\n' +  credentialScope + '\n' +  sha256(canonicalRequest);

    const signingKey = getSignatureKey(secretKey, datestamp, region, service);
    const signature = hmacSha256(stringToSign, signingKey);

    const authorizationHeader = algorithm + ' ' + 'Credential=' + accessKey + '/' + credentialScope + ',' +  'SignedHeaders=' + signedHeaders + ',' + 'Signature=' + signature;

    const params = {
        method: method,
        headers: {
            'Authorization': authorizationHeader,
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzdate
        },
    };

    if (body !== '' && body !== null && body !== undefined) {
        params.body = body;
    }

    return fetch(endpoint, params);
}

exports.init = (config) => {
    accessKey = config.accessKey;
    secretKey = config.secretKey;
};

exports.getObject = (region, bucket, filename) =>
    signAndSendRequest(region, 'GET', bucket, filename);

exports.putObject = (region, bucket, filename, data) =>
    signAndSendRequest(region, 'PUT', bucket, filename, data);

exports.deleteObject = (region, bucket, filename) =>
    signAndSendRequest(region, 'DELETE', bucket, filename);
