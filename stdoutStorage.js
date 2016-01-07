(
function __stdoutStorage() {
    var _storageStream = require('./StorageStreamWriter.js');
    var _              = require('underscore');
    var Common         = require('./common.js');

    
    
    var _defaultstdoutwrite = null;
    var _defaultconsoleerr = null;
    

    function stdoutStorage() {
        
    
    }

    stdoutStorage.prototype.hook = function (options) {
        
        _storageStream.init(options);
        
        _defaultstdoutwrite = process.stdout.write;
        _defaultconsoleerr = console.error;


        process.stdout.write  = (function (write) {
            return function (string, encoding, fd) {
                var args = _.toArray(arguments);
                write.apply(process.stdout, args);
                
                _storageStream.push(Common.getFormattedLine(false, 'W', string), encoding);
            };
        }(process.stdout.write));



        console.error = (function (log) {
            return function () {
                var args = _.toArray(arguments);
                
                _storageStream.push(Common.getFormattedLine(false, 'E', args + '\n'));
            };
        }(console.error));


        console.logImmediate = function (d, cb) { 
            _storageStream.write(Common.getFormattedLine(true, 'W', d), cb);
        }
    }
    
    
    // removes the stdout to storage hook.
    stdoutStorage.prototype.unhook = function (cb) {
        delete console.logImmediate;

        if(_defaultstdoutwrite)
         process.stdout.write = _defaultstdoutwrite;
        
        if(_defaultconsoleerr)
            console.error = _defaultconsoleerr;

        _storageStream.finalize(cb);
    }
    
    module.exports = new stdoutStorage();

})();