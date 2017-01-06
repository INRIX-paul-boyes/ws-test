define(['lib/HttpResponse', 'lib/Url'], function(HttpResponse, Url) {
    'use strict';

    var Http = {
        ajax: function(config) {
            var
                proxy,
                prop,
                isPost,
                response = new HttpResponse(),
                xhr = new XMLHttpRequest();

            // Default to GET
            if (typeof config.method !== 'string') {
                config.method = 'GET';
            } else {
                config.method = config.method.toUpperCase();
            }

            // Make sure we've got a valid url
            if(typeof config.url === 'string') {
                config.url = new Url(config.url).toString();
            } else if(config.url instanceof Url) {
                config.url = config.url.toString();
            } else {
                throw Exception.buildIllegalArgumentException(
                    'Invalid URL'
                );
            }

            // Indicate if the request needs to be proxied to get around CORS
            var turl = new Url(config.url);
            proxy = turl.origin !== location.protocol + "//" + location.host;
            if (proxy) {
                // Send the request to our server, which will later return the response from the url we're requesting
                config.url = '/rest/send?url=' + encodeURIComponent(config.url) + '&method=' + config.method;
                if (config.headers) {
                    config.url += "&sendheaders="+config.headers;
                }

                // If we're doing a POST against an external URL, we actually have to do a GET request
                // against our proxy solution.
                if (proxy && config.method === 'POST' && config.data) {
                    if (config.postMimeType) {
                        config.url += '&mimeType=' + config.postMimeType;
                    }
                    config.url += '&payload=' + encodeURIComponent(config.data);
                    config.method = 'GET';
                    delete config.data;
                }
            }

            xhr.onreadystatechange = function() {
                switch(this.readyState) {
                    // HEADERS_RECEIVED
                    case 2:
                        response
                            .setHeaders(this.getAllResponseHeaders())
                            .setStatus(this.status)
                            .setStatusText(this.statusText);
                        break;
                    // LOADING
                    case 3:
                        break;
                    // DONE
                    case 4:
                        response.setData(this.response, config.dataType);
                        if (typeof config.complete === 'function') {
                            config.complete(response);
                        }
                        if (response.isSuccess) {
                            if (typeof config.success === 'function') {
                                config.success(response);
                            }
                        } else if (typeof config.error === 'function') {
                            config.error(response);
                        }
                }
            };

            xhr.open(config.method, config.url, true);
            xhr.responseType = 'text';
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            if(config.overrideMimeType) {
                xhr.overrideMimeType(config.overrideMimeType);
            }

            if(typeof config.headers !== 'undefined') {
                for(prop in config.headers) {
                    if(config.headers.hasOwnProperty(prop)) {
                        xhr.setRequestHeader(prop, config.headers[prop]);
                    }
                }
            }

            isPost = config.method === 'POST';
            if(isPost) {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }

            xhr.send(isPost ? config.data : null);
        }
    };

    return Http;
});
