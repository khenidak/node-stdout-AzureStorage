(
function () {
    var crypto = require('crypto');
    var utils = require('util');

    var algo = 'SHA256';
    var hashencoding = 'base64';
    
    var arStandardHeaders = ['content-encoding', 'content-language', 'content-length', 'content-md5', 'content-type', 
        'date', 'If-Modified-Since', 'If-Match', 'If-None-Match', 'If-unmodified-Since', 'range'];
    

    module.exports = {
        
        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
        
        IsStringNullEmpty : function (s) { 
                return !(s === null || s.match(/^ *$/) !== null);
        },

        getUTCTime : function () {
            
            var d = new Date();
            return new Date(
                        d.getUTCFullYear(),
                        d.getUTCMonth(),
                        d.getUTCDate(),
                        d.getUTCHours(),
                        d.getUTCMinutes(), 
                        d.getUTCSeconds(),
                        d.getUTCMilliseconds()
            ).getTime();
        },
        
        /* 
          this the log formatter change as needed 
         */
        getFormattedLine : function (bImmediate, o, line) {
            var d = new Date();
            var sDate = d.getUTCDay()     + '/' + 
                        d.getUTCMonth()   + '/' + 
                        d.getUTCFullYear()    + ' ' + 
                        d.getUTCHours()   + ':' + 
                        d.getUTCMinutes() + ':' + 
                        d.getUTCSeconds() + ':' + 
                        d.getUTCSeconds()
            return utils.format('%s %s[%s] %s', (bImmediate ? '*' : ''), o, sDate, line);
        },



        getUtCTicks : function () {
            return ((this.getUTCTime() * 10000) + 621355968000000000);
        },

        /* 
         gets a storage shared key based on https://msdn.microsoft.com/en-us/library/azure/dd179428.aspx 
         works with  api version 2015-04-05
         typical call style 
                 getStorageSharedKey(METHOD, ACCOUNTNAME, headers {'key' : 'val'}, PATH, querystring{'key': 'val'} ,STORAGEKEY);
                 
                 examples: 
                    // create append blob : https://msdn.microsoft.com/en-us/library/azure/dd179451.aspx 
                 getStorageSharedKey('PUT', 'myaccount', { 'x-ms-blob-type' : 'AppendBlob' , 'content-length' : '' }, {}, storageKey); 
                    // append data to existing append blob: https://msdn.microsoft.com/en-us/library/azure/mt427365.aspx
                    getStorageSharedKey('PUT', 'myaccount', { 'content-length' : lengthinbytes }, { 'comp' : 'appendblock' }, storageKey); 
        */ 

        getStorageSharedKey :  function (verb, accountName, headers, path, querystring, key) {
                var sSaS = verb + '\n';
                var sCanonicalHeaders = '';
                var sCanonicalResource = '';
                var sPath = (path) ? path : '/';
                var b64Key = new Buffer(key, hashencoding);
                var tempKeys = [];
        
        
                if (!headers)
                    headers = {};
        
                // headers
                arStandardHeaders.forEach(function (elem) {
                    if (headers.hasOwnProperty(elem)) {
                        sSaS += headers[elem] + '\n';
                    }
                    else {
                        sSaS += '\n';
                    }
                });
        
                // headers that are not standard
                for (var prop in headers) {
                    if (-1 == arStandardHeaders.indexOf(prop) && 'x-ms' == prop.substring(0, 4)) {
                        tempKeys.push(prop);
                    }
                }
        
                tempKeys.sort();
                for (var i = 0; i < tempKeys.length; i++) {
                    sCanonicalHeaders += tempKeys[i] + ':' + headers[tempKeys[i]] + '\n';
                }
        
                // process resource
                sCanonicalResource = '/' + accountName + sPath;
                tempKeys = [];
        
                for (var prop in querystring) {
                    tempKeys.push(prop);
                }
        
        
        
                // proces query strings
                if (tempKeys.length > 0)
                    sCanonicalResource += '\n';
        
        
        
        
                tempKeys.sort();
                for (var i = 0; i < tempKeys.length; i++) {
                    sCanonicalResource += tempKeys[i] + ':' + querystring[tempKeys[i]]
            
                    if (i != tempKeys.length - 1)
                        sCanonicalResource += '\n'
                }
        
                sSaS += sCanonicalHeaders + sCanonicalResource;
        
        
        
                // generate hash
                var hashedSaS = crypto.createHmac(algo, b64Key).update(sSaS, 'utf-8').digest(hashencoding);
                return hashedSaS;
                },
          



    
    
    };





}


)();