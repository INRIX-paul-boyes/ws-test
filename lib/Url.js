/**
 * Class representing a URI.
 * @module common/lib/Url
 */
define(function() {
    'use strict';

    var absoluteUrlRegExp   = /^(?:https?|s?ftp):\/\/([^:\/\s]+)(?::(\d*))?/,
        urlRegExp           = /^(?:((?:https?|s?ftp):)\/\/)([^:\/\s]+)(?::(\d*))?(?:\/([^\s?#]+)?([?][^?#]*)?(#.*)?)?/;


    var locShadow = {};

    /**
     *
     * @param   {String}    [uri=""]    The uri to parse.  Defaults to the current window location.
     *
     * @constructor
     *
     * @alias module:common/lib/Url
     */
    var Url = function(uri) {
        var parts,
            relativeUrlBase;

        // Convert null or undefined into a url representing the current location
        if(uri === null || typeof uri === 'undefined') {
            uri = '';
        }

        // Convert a relative url into an absolute url
        if(!absoluteUrlRegExp.test(uri)) {

            // If the url doesn't start with a "/" then we need to append the highest directory in the pathname
            // of the current window location
            if(uri[0] !== "/") {
                parts = location.pathname.split("/");
                parts[parts.length - 1] = "";
                relativeUrlBase = parts.join("/");
                uri = relativeUrlBase + uri;
            }
            locShadow.origin = locShadow.origin || location.protocol+'//'+location.host;
            uri = locShadow.origin + uri;
        }

        // Attempt to parse the url
        parts           = urlRegExp.exec(uri);
        this.href       = parts[0] || "";
        this.protocol   = parts[1] || "";
        this.hostname   = parts[2] || "";
        this.port       = parts[3] || "";
        this.pathname   = "/" + (parts[4] || "");
        this.search     = parts[5] || "";
        this.hash       = parts[6] || "";
        this.host       = this.hostname + (this.port ? ":" + this.port : "");
        this.origin     = this.protocol + "//" + this.host;
    };

    /**
     * @function
     *
     * @description
     * Outputs the string representation of the Uri.
     *
     * @return  {String}    The string representation of the uri.
     */
    Url.prototype.toString = function() {
        return this.href;
    };

    /**
     * @function
     *
     * @description
     * Converts the specified object-literal into a url-safe query-string.
     *
     * @param   {Object}    props   Object-literal of key-value pairs.
     *
     * @return  {String}    The object-literal key-value pairs as a url-safe query-string.
     */
    Url.toQueryString = function(props) {
        var prop,
            data = [];
        for(prop in props) {
            if(props.hasOwnProperty(prop)) {
                data.push(encodeURIComponent(prop) + '=' + encodeURIComponent(props[prop]));
            }
        }
        return data.join('&');
    };

    /**
     * @function
     *
     * @description
     * Converts the specified url query-string into a object literal of key-value pairs.
     *
     * @param   {String}    qs  The query-string.
     *
     * @return  {Object}    Object literal of key-value pairs found in the query-string.
     */
    Url.parseQueryString = function(qs) {
        var values,
            data = {};
        // Trim the starting ?
        if(qs.length > 0 && qs[0] === "?") {
            qs = qs.substr(1);
        }
        if(typeof qs === "string") {
            // Split on &
            values = qs.split('&');
            // Put together our object
            values.forEach(function(value) {
                var parts = value.split('=');
                if(parts.length > 0) {
                    data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]) || "";
                }
            });
        }
        return data;
    };

    return Url;

});
