(
function __StorageStreamWriter() {
    var request = require('request');
    var fs     = require('fs');
    var MemoryStream = require('memorystream');
    var Common = require('./common.js');
    var utils  = require('util');
    var utf8   = require('utf8');
    var Q      = require('q');

    
    
    // **** Defaults ****/
    var DEFAULT_MAX_BUFFER_SIZE = 1024 * 1204 * 3// 3 megs (though max request is 4 megs)
    var DEFAULT_MAX_FILE_SIZE   = 1024 * 1024 * 100; // 100 megs  
    
    var urlHost = 'https://%s.blob.core.windows.net';
    var urlPath = '/%s/%s';
    var authHeaderValue = 'SharedKey %s:%s'
   
    
    /*** G Vars ***/

    var _options = {
        'ByteBufferSize' : DEFAULT_MAX_BUFFER_SIZE,
        'ByteFileSize'   : DEFAULT_MAX_FILE_SIZE,
        'AccountName'    : '',
        'ContainerName'  : '',
        'BlobNamePrefix' : '',
        'StorageKey'     : ''
    };
    

    var _stream = null; // memory stream (basically buffer) inited when init is called
    var _bReady = false; // are inited? 
    
    var currentFileSize = 0; 
    var currentBlobName = null;
    var p = null;
    
    /*********** intrenal functions ***********/
    var checkReady = function () { 
        if (!_bReady)
            throw 'Storage Stream is not initiated';
    }
    
    var getNewBlobName = function () {
        return _options.BlobNamePrefix + Common.getUtCTicks();
    }
    
    var getdefaultRequestOptions = function (blobName, method, additionlHeaders, queryString) {
        var utcDate = (new Date()).toUTCString();
        
        var path = utils.format(urlPath, _options.ContainerName, blobName);
        
        var headers = 
                    {
            'x-ms-version' : '2015-04-05',
            'x-ms-date' : utcDate
            }
        
        // copy additional headers 
        for (var header in additionlHeaders) {
            headers[header] = additionlHeaders[header];
        }
        
        // get the funky shared key 
        headers['Authorization'] = 'SharedKey ' + _options.AccountName + ':' + Common.getStorageSharedKey(method, _options.AccountName, headers, path, queryString , _options.StorageKey);
        
        return {
            url: utils.format(urlHost, _options.AccountName) + path,
            method: method,
            headers: headers, 
            qs: queryString
        };
    }
    
    var setupBlob = function (byteSize) {

        var d = Q.defer();
        _current = p;
        p = d.promise;

       _current.then(function () { 
            if (currentFileSize + byteSize > _options.ByteFileSize || !(currentBlobName)) {
                var blobName = getNewBlobName();
                var options = getdefaultRequestOptions(blobName, 'PUT', { 'x-ms-blob-type' : 'AppendBlob' , 'content-length' : '' });
                
                request(options, function (err, response, body) {
                    
                    if (err)
                        throw err
                    
                    // reset file size
                    currentFileSize = byteSize ;
                    currentBlobName = blobName;
                    d.resolve(blobName);
                });
            }
            else {
                currentFileSize += byteSize ;
                d.resolve(currentBlobName);
            }
        });
        
    
        return p;        
    }
         
    var safeAppend = function (str, callback) {
        var strbyteSize = Buffer.byteLength(str, 'utf8');
        setupBlob(strbyteSize).then(function (targetBlob) { 
            append(str, strbyteSize, targetBlob, callback);
        });
    }
    
    var append = function (str, byteSize, targetBlobName, callback) {
        var options = getdefaultRequestOptions(targetBlobName, 'PUT', { 'content-length' : byteSize }, { 'comp' : 'appendblock' });
        options['body'] = utf8.encode(str); 
            
        request(options, function (err, response, body) {
            if (err) throw err;
                if (callback)
                    callback();
            });
    }
        
    

    
    

    function StorageStreamWriter() { 
        this.Options = null;
    }
    
   
    StorageStreamWriter.prototype.setOptions = function(options)
    {
        if (null == options)
            throw 'options is null';
        

        if (
                options.hasOwnProperty('ByteBufferSize') && 
                Common.isNumber(options['ByteBufferSize']) && 
                options['ByteBufferSize'] >= 0 && 
                options['ByteBufferSize'] < DEFAULT_MAX_BUFFER_SIZE
            )
                _options['ByteBufferSize'] = options['ByteBufferSize'];   
        
        
        
        if (
            options.hasOwnProperty('ByteFileSize') && 
            Common.isNumber(options['ByteFileSize']) && 
            options['ByteFileSize'] > 0 && 
            options['ByteFileSize'] < DEFAULT_MAX_FILE_SIZE
            )
            _options['ByteFileSize'] = (options['ByteFileSize'] < _options['ByteBufferSize']) ? _options['ByteBufferSize'] + 1024 * 1024 * 2 : options['ByteFileSize'];   
        
        

        if (options.hasOwnProperty('AccountName') && Common.IsStringNullEmpty(options['AccountName'])) {
            _options['AccountName'] = options['AccountName']
        }
        else { 
            throw 'invalid storage account name';
        }
        


        if (options.hasOwnProperty('ContainerName') && Common.IsStringNullEmpty(options['ContainerName'])) {
            _options['ContainerName'] = options['ContainerName']
        }
        else {
            throw 'invalid containerName';
        }

        if (options.hasOwnProperty('StorageKey') && Common.IsStringNullEmpty(options['StorageKey'])) {
            _options['StorageKey'] = options['StorageKey']
        }
        else {
            throw 'invalid StorageKey';
        }
        
        
        if (options.hasOwnProperty('BlobNamePrefix') && Common.IsStringNullEmpty(options['BlobNamePrefix'])) {
            _options['BlobNamePrefix'] = options['BlobNamePrefix']
        }
    }

    StorageStreamWriter.prototype.init = function (options)
    {
        if (_bReady)
            throw "already initlized";

        this.setOptions(options);
        
        d = Q.defer();
        p = d.promise;
        
        
        

        _stream = new MemoryStream();
        _stream.pause();
        
        _stream.setEncoding('utf8');
        
        d.resolve();


        _stream.on('readable', function () {
            var chunk;
            chunk = (_options.ByteBufferSize == 0) ? _stream.read() : _stream.read(_options.ByteBufferSize);

            if (null != chunk ) { 
                safeAppend(chunk);
            } 
        });
          
        _bReady = true;
    }

    StorageStreamWriter.prototype.push = function (chunk, encoding) {
        checkReady();    
        _stream.write(chunk, encoding);
    }
        
    StorageStreamWriter.prototype.finalize = function(cb)
    {
        checkReady();
        var chunk;
        if (null != (chunk = _stream.read())) {
            safeAppend(chunk, function () {
                _bReady = false;
                if (cb) cb();
            });
        }
        else { 
            _bReady = false;
            if (cb) cb();
        }
    }
    
    StorageStreamWriter.prototype.write = function(str, callBack)
    { 
        checkReady();
        safeAppend(str, callBack);
    }

    // Module Exports //    
    
    module.exports.Constants = {
        'ByteBufferSize': DEFAULT_MAX_BUFFER_SIZE,
        'ByteFileSize'  : DEFAULT_MAX_FILE_SIZE,
    }
    



    module.exports = new StorageStreamWriter();    
})();
