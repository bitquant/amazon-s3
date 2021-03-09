var sha256 = require('crypto-js/sha256');
var hmacSha256 = require('crypto-js/hmac-sha256');

/*
   Documentation:
   https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
*/

function encodeRfc3986(urlEncodedString) {
  return urlEncodedString.replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

function encodeRfc3986Full(str) {
  return encodeRfc3986(encodeURIComponent(str))
}

function encodePath(path) {
    path = decodeURIComponent(path.replace(/\+/g, ' '));
    path = encodeRfc3986Full(path);
    path = path.replace(/%2F/g, '/')
    return path;
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
    var keyDate = hmacSha256(dateStamp, "AWS4" + key);
    var keyRegion = hmacSha256(regionName, keyDate);
    var keyService = hmacSha256(serviceName, keyRegion);
    var keySigning = hmacSha256("aws4_request", keyService)
    return keySigning;
}

S3.prototype.signAndSendRequest = function(method, bucket, path, body) {

    const amzdate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
    const datestamp = amzdate.slice(0, 8)

    const service = 's3';
    const host = (this.domain !== 'digitaloceanspaces.com')
        ? `${bucket}.${service}.${this.region}.${this.domain}`
        : `${bucket}.${this.region}.${this.domain}`

    const encodedPath = encodePath(path);
    const endpoint = `https://${host}${encodedPath}`;

    const canonicalUri = encodedPath;
    const canonicalQuerystring = '';
    const payloadHash = 'UNSIGNED-PAYLOAD';
    const canonicalHeaders = `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzdate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const algorithm = 'AWS4-HMAC-SHA256';

    const canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + payloadHash;

    const credentialScope = datestamp + '/' + this.region + '/' + service + '/' + 'aws4_request';
    const stringToSign = algorithm + '\n' +  amzdate + '\n' +  credentialScope + '\n' +  sha256(canonicalRequest);

    const signingKey = getSignatureKey(this.secretKey, datestamp, this.region, service);
    const signature = hmacSha256(stringToSign, signingKey);

    const authorizationHeader = algorithm + ' ' + 'Credential=' + this.accessKey + '/' + credentialScope + ',' +  'SignedHeaders=' + signedHeaders + ',' + 'Signature=' + signature;

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

//
// Any S3 compatible service provider can be used. The default is AWS.
//
//   AWS             amazonaws.com
//   Digital Ocean   digitaloceanspaces.com
//   Scaleway        scw.cloud
//
var defaultDomain = 'amazonaws.com'


function S3(config) {

    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
    this.region = config.region;
    this.domain = (config.domain !== undefined) ? config.domain : defaultDomain;
}

S3.prototype.getObject = function(params) {
    return this.signAndSendRequest('GET', params.bucket, params.key);
}

S3.prototype.putObject = function(params) {
    return this.signAndSendRequest('PUT', params.bucket, params.key, params.body);
}

S3.prototype.deleteObject = function(params) {
    return this.signAndSendRequest('DELETE', params.bucket, params.key);
}

module.exports = S3;
