# amazon-s3
Read and write objects to amazon S3 using fetch()

## Install
```
$ npm install amazon-s3
```

## Usage
```javascript
var s3 = require('amazon-s3')
global.fetch = require('node-fetch')

s3.init({
    accessKey: '<private accessKey>',
    secretKey: '<private secretKey>'
});

(async function() {
    try {

        let region = 'us-east-1';
        let bucket = 'testbucket';
        let filepath = '/a/test/file.txt';
        let filedata = 'test file contents';

        let putResponse = await s3.putObject(region, bucket, filepath, filedata)

        console.log(`put status: ${putResponse.status}`)
        console.log(`put response body: '${await putResponse.text()}'`)

        let getResponse = await s3.getObject(region, bucket, filepath);

        console.log(`get status: ${getResponse.status}`)
        console.log(`get response body: '${await getResponse.text()}'`)

        let delResponse = await s3.deleteObject(region, bucket, filepath);

        console.log(`del status: ${delResponse.status}`)
        console.log(`del response body: '${await delResponse.text()}'`)
    }
    catch (ex) {
        console.log(ex)
    }
}());
```

## License
MIT license; see [LICENSE](./LICENSE).
