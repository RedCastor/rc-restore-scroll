/**
 * RC Restore Scroll
 */
(function(rcrs) {
    "use strict";

    //Prevent run twice
    if (rcrs.hasInitialised) {
        return;
    }

    var utils = {
        removeItem: function(key) {
            if (typeof(sessionStorage) !== 'undefined') {

                sessionStorage.removeItem(key);
            }
        },
        setItem: function (key, value) {
            if (typeof(sessionStorage) !== 'undefined') {

                if (typeof value === "object") {
                    value = JSON.stringify(value);
                }

                sessionStorage.setItem(key, value);
            }
        },
        getItem: function (key) {
            if (typeof(sessionStorage) !== 'undefined') {
                try {

                    var value = sessionStorage.getItem(key);

                    var obj_val = JSON.parse(value);

                    return (typeof obj_val === "object") ? obj_val : value;
                }
                catch (e) {
                    return null;
                }
            }

            return null;
        },
        isPlainObject: function(obj) {
            // The code "typeof obj === 'object' && obj !== null" allows Array objects
            return (
                typeof obj === 'object' && obj !== null && obj.constructor === Object
            );
        },
        // only used for extending the initial options
        deepExtend: function(target, source) {
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    if (
                        prop in target &&
                        this.isPlainObject(target[prop]) &&
                        this.isPlainObject(source[prop])
                    ) {
                        this.deepExtend(target[prop], source[prop]);
                    } else {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        },
    };

    var defaultOptions = {
        id: null,
        timeoutHeight: 1000,
        size: 25,
        timeout: 300,
        offset: 0
    };


    rcrs = {
        initialise: function(options) {

            //Init options
            utils.deepExtend((this.options = {}), defaultOptions);

            if (utils.isPlainObject(options)) {
                utils.deepExtend(this.options, options);
            }

            this.history = utils.getItem('scrollHistory') || {};

            if (typeof this.history === "object") {

                if (!this.history.urls || !Array.isArray(this.history.urls) || !this.history.scrolly || !Array.isArray(this.history.scrolly)) {
                    this.history.urls = [];
                    this.history.scrolly = [];
                }
            }
            else {
                this.history = {
                    urls: [],
                    scrolly: []
                };
            }

            this.options.timeoutHeight = parseInt(this.options.timeoutHeight, 10);
            this.options.size = parseInt(this.options.size, 10);
            this.options.timeout = parseInt(this.options.timeout, 10);
            this.options.offset = parseInt(this.options.offset, 10);

            if (!this.options.timeout) {
                this.options.timeout =  defaultOptions.timeout;
            }

            window.addEventListener("DOMContentLoaded", rcrs.restoreScroll);
            window.addEventListener("beforeunload", rcrs.saveScroll);
        },
        setSize: function( num  ) {

            this.options.size = parseInt(num, 10);
        },
        setTimeout: function( num  ) {

            this.options.timeout = parseInt(num, 10);
        },
        getSize: function( num  ) {

            return this.options.size;
        },
        getTimeout: function( num  ) {

            return this.options.timeout;
        },
        getHistory: function(url) {

            if (url) {
                var i = this.history.urls.indexOf(url);

                if (i !== - 1) {
                    return {url: this.history.urls[i], scrolly: this.history.scrolly[i]};
                }
            }

            return {url: null, scrolly: {pos: 0,  id: null, height: null}};
        },
        removeHistory: function (url) {

            var i = this.history.urls.indexOf(url);
            var hi = this.history.urls.indexOf(url + '#/');

            if (i !== -1) {
                this.history.urls.splice(i, 1);
                this.history.scrolly.splice(i, 1);
            }

            if (hi !== -1) {
                this.history.urls.splice(hi, 1);
                this.history.scrolly.splice(hi, 1);

            }

            if (this.history.urls.length > this.options.size) {

                for (var ie = 0; ie < this.history.urls.length - this.options.size; ie++) {

                    this.history.urls.splice(ie, 1);
                    this.history.scrolly.splice(ie, 1);
                }
            }
        },
        addHistory: function(url, position, id, height) {

            var i = this.history.urls.indexOf(url);

            if (i !== -1) {
                this.history.scrolly[i] = {pos: position,  id: id, height: height};
            }
            else {
                this.history.urls.push(url);
                this.history.scrolly.push({pos: position,  id: id, height: height});
            }
        },
        saveHistory: function() {

            utils.setItem('scrollHistory', this.history);
        },
        restoreScroll: function() {

            var href = window.location.href;
            var item = rcrs.getHistory(href);

            if (item.url) {

                rcrs.removeHistory(item.url);
                rcrs.saveHistory();

                if (!item.scrolly || typeof item.scrolly !== "object") {
                    return;
                }

                window.scrollTo(0, 0);

                if (item.scrolly.id && item.scrolly.height) {

                    var elem_id = document.getElementById(item.scrolly.id);

                    if (elem_id) {
                        elem_id.style.minHeight = item.scrolly.height + 'px';

                        setTimeout(function() {

                            elem_id.style.minHeight = null;
                        }, rcrs.options.timeoutHeight);
                    }
                }

                setTimeout(function() {

                    window.scrollTo(0, (item.scrolly.pos + rcrs.options.offset));
                }, rcrs.options.timeout);
            }
        },
        saveScroll: function () {

            var to_url = document.activeElement.href;
            var href = window.location.href;

            //Back and Next button return activeElement href to undefined.
            //So we can remove the scroll position in history.
            if (to_url) {

                var item = rcrs.removeHistory(to_url);
            }

            var elem_id = document.getElementById(rcrs.options.id);
            var height = (elem_id ? parseInt(elem_id.clientHeight, 10) : null);

            rcrs.addHistory(href, parseInt(window.scrollY, 10), rcrs.options.id, height);
            rcrs.saveHistory();
        },
        destroy: function () {

            window.removeEventListener("DOMContentLoaded", rcrs.restoreScroll);
            window.removeEventListener("beforeunload", rcrs.saveScroll);
        }
    };

    //Prevent run twice
    rcrs.hasInitialised = true;

    window.rcrs = rcrs;
})(window.rcrs || {});