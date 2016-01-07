
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




// your typical console.log call    
setInterval(function () {
    console.log("I log therefore I am");
}, 250 );



setTimeout(function () {
    // log immediate allows you to log, with a call back when log is actually
    // written to the blob
    console.logImmediate("immediate log", function () { 
        // log was created..

    });
}, 1000 * 20);



// beforeExit is called on graceful exit, you are allowed 
// to perform async operations. 
process.on('beforeExit', function () {
    customstdout.unhook(function () { 
        console.log('unhook is done')
    });
})
