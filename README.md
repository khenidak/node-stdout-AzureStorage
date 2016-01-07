# Redirect node stdout to Azure Storage #
This component allows you redirect node stdout and stream it to Azure Storage (on an append blob)

## The Component Consists of Two Parts ##
**Azure Stream Writer**: Allows you to perform buffered write (or immediate out of band writes) to an append blob. The component creates new blobs as needed. The module is designed to work in stand alone fashion as well

** stdoutStorage **: Hooks into node stdout to call Azure Stream Writer.


## Basic Usage ##
```

// hook into stdout
var customstdout = require('./stdoutStorage.js');

var options = {
   'ByteBufferSize' : 1024, // buffer in mem for xxx then write the entire buffer (one call) to azure storage. ( can not exceed 3 meg, check StorageStreamWriter Constants).
   'ByteFileSize'   : 1024 * 1024 * 10, // each file size (max 100 megs, to allow easy download of logs, note append blob can take more data).
   'AccountName'    : '<storage account name>', // your storage acocunt
   'ContainerName'  : '<container name>', // the target container (must be created prior)
   'BlobNamePrefix' : 'i-', // the component overflow to new files (and create them) it will use this prefix.
   'StorageKey'     : '<storage account key>' // storage key
};

// stdout is redirected to azure append blob
customstdout.hook(options);

//normal node code
console.log("I log therefore I am"); // this is a buffered call, i.e will not be written immediatly

//write to stdout and get a call back when it was written to azure storage blob

console.logImmediate("immediate log", function () {
       // log was created..
});


// restore everything back to normal
customstdout.unhook(function () {
       console.log('unhook is done')
   });


```

## Due Credit ##
The stdout hijacking is largely based on https://gist.github.com/benbuckman/2758563

The following node modules are referenced:
1. cypto
2. underscore
3. memorystream
4. q
5. utf8
