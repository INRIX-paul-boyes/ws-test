define(function(require) {
    'use strict';

    var parseHeaders = function(headers) {
        var i,
            ii,
            unparsedHeader,
            endOfNameIdx,
            name,
            value,
            unparsedHeaders = headers.split('\n'),
            parsedHeaders = {};
        for(i = 0, ii = unparsedHeaders.length; i < ii; i++) {
            unparsedHeader = unparsedHeaders[i];
            if(unparsedHeader.length === 0) {
                continue;
            }
            endOfNameIdx = unparsedHeader.indexOf(':');
            if(endOfNameIdx < 0) {
                continue;
            }
            name = unparsedHeader.substring(0, endOfNameIdx).trim();
            value = unparsedHeader.substring(endOfNameIdx + 1).trim();
            parsedHeaders[name] = value;
        }
        return parsedHeaders;
    };

    /**
     * @class
     * Class representing the response from an HTTP request.
     *
     * @constructs
     *
     * @param   {Object}    headers     The response headers.
     * @param   {Number}    status      The response status code.
     * @param   {String}    statusText  The response statusText.
     * @param   {Object}    data        The response data.
     */
    var HttpResponse = function(headers, status, statusText, data) {
        this.isSuccess = false;
        this.isTimeout = false;
        this.setHeaders(headers)
            .setStatus(status)
            .setStatusText(statusText)
            .setData(data);
    }

    HttpResponse.prototype = {
        /**
         * Sets the response headers.
         *
         * @param   {String|Object} headers The headers.
         *
         * @return  {HttpResponse}   The HttpResponse for chaining.
         */
        setHeaders: function(headers) {
            if(typeof headers === 'string') {
                this.headers = parseHeaders(headers);
            } else {
                this.headers = headers;
            }
            return this;
        },

        /**
         * Sets the response status.
         *
         * @param   {Number}                The status.
         *
         * @return  {HttpResponse}   The HttpResponse for chaining.
         */
        setStatus: function(status) {
            this.status = status;
            this.isSuccess = (this.status >= 200 && this.status < 300);
            return this;
        },

        /**
         * Sets the response status text.
         *
         * @param   {String} statusText     The response status text.
         *
         * @return  {HttpResponse}   The HttpResponse for chaining.
         */
        setStatusText: function(statusText) {
            this.statusText = statusText;
            return this;
        },

        /**
         * Sets the response status text.
         *
         * JSON data will be converted to an object if the 'json' dataType is specified.
         * This conversion will be prevented if the 'text' dataType is specified.
         * Use of an undefined dataType will result in an object conversion if the incoming mime type is application/json.
         *
         * @param   {Mixed}     data        The response data.
         * @param   {String}    [dataType]  The expected data type.  If not set the Content-Type header is used instead.
         *
         * @return  {HttpResponse}   The HttpResponse for chaining.
         */
        setData: function(data, dataType) {
            var responseData;
            if(this.isSuccess) {
                if (dataType !== 'text'
                    && (dataType === 'json'
                    || (this.getHeader('Content-Type') && this.getHeader('Content-Type').indexOf('application/json') >= 0)
                    )
                    ) {
                    try {
                        responseData = JSON.parse(data);
                    } catch(je) {
                        Log.error('Error parsing JSON data: ' + je, data);
                        responseData = data;
                    }
                    // we have to remove DOMParser stuff here, since Workers don't have a DOMParser.
                } else {
                    responseData = data;
                }
            } else {
                responseData = data;
            }
            this.data = responseData;
            return this;
        },

        /**
         * Returns the specified header.
         *
         * @param   {String}            name    The name of the header to return.
         *
         * @return  {String|undefined}  The value of the header.
         */
        getHeader: function(name) {
            return this.headers && this.headers[name];
        }
    };

    return HttpResponse;
});
