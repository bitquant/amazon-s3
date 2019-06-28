# amazon-s3
Read and write objects to amazon S3 using fetch()

## Install
```
$ npm install amazon-s3
```

## Usage
```javascript
var S3 = require('amazon-s3')
global.fetch = require('node-fetch')

var s3 = new S3({
    accessKey: '<private accessKey>',
    secretKey: '<private secretKey>',
    region: 'us-east-1'
});

(async function() {
    try {

        let bucket = 'testbucket';
        let key = '/a/test/file.txt';
        let body = 'test file contents';

        let putResponse = await s3.putObject({bucket, key, body})

        console.log(`put status: ${putResponse.status}`)
        console.log(`put response body: '${await putResponse.text()}'`)

        let getResponse = await s3.getObject({bucket, key});

        console.log(`get status: ${getResponse.status}`)
        console.log(`get response body: '${await getResponse.text()}'`)

        let delResponse = await s3.deleteObject({bucket, key});

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
