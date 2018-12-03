'use strict';

if ('serviceWorker' in navigator) {
    // If service workers are supported
    navigator.serviceWorker.register('/service-worker.js');
} else if ('applicationCache' in window) {
    // Otherwise inject an iframe to use appcache
    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', '/appcache.html');
    iframe.setAttribute('style', 'width: 0; height: 0; border: 0');
    document.querySelector('footer').appendChild(iframe);
}
