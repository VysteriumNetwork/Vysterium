/*globals selfindex$config*/
// Users must import the config (and bundle) prior to importing uv.sw.js
// This is to allow us to produce a generic bundle with no hard-coded paths.

/**
 * @type {import('../uv').ServiceCtor}
 */
const Service = self.Service;

const cspHeaders = [
    'cross-origin-embedder-policy',
    'cross-origin-opener-policy',
    'cross-origin-resource-policy',
    'content-security-policy',
    'content-security-policy-report-only',
    'expect-ct',
    'feature-policy',
    'origin-isolation',
    'strict-transport-security',
    'upgrade-insecure-requests',
    'x-content-type-options',
    'x-download-options',
    'x-frame-options',
    'x-permitted-cross-domain-policies',
    'x-powered-by',
    'x-xss-protection',
];
const emptyMethods = ['GET', 'HEAD'];

class ServiceWorker extends Service.EventEmitter {
    constructor(config = selfindex$config) {
        super();
        if (!config.bare) config.bare = '/bare/';
        if (!config.prefix) config.prefix = '/service/';
        this.config = config;
        const addresses = (
            Array.isArray(config.bare) ? config.bare : [config.bare]
        ).map((str) => new URL(str, location).toString());
        this.address = addresses[~~(Math.random() * addresses.length)];
        /**
         * @type {InstanceType<Service['BareClient']>}
         */
        this.bareClient = new Service.BareClient(this.address);
    }
    /**
     *
     * @param {Event & {request: Request}} param0
     * @returns
     */
    async fetch({ request }) {
        /**
         * @type {string|void}
         */
        let fetchedURL;

        try {
            if (!request.url.startsWith(location.origin + this.config.prefix))
                return await fetch(request);

            const Service = new Service(this.config, this.address);

            if (typeof this.config.construct === 'function') {
                this.config.construct(Service, 'service');
            }

            const db = await Service.cookie.db();

            Service.meta.origin = location.origin;
            Service.meta.base = Service.meta.url = new URL(
                Service.sourceUrl(request.url)
            );

            const requestCtx = new RequestContext(
                request,
                this,
                Service,
                !emptyMethods.includes(request.method.toUpperCase())
                    ? await request.blob()
                    : null
            );

            if (Service.meta.url.protocol === 'blob:') {
                requestCtx.blob = true;
                requestCtx.base = requestCtx.url = new URL(
                    requestCtx.url.pathname
                );
            }

            if (
                request.referrer &&
                request.referrer.startsWith(location.origin)
            ) {
                const referer = new URL(
                    Service.sourceUrl(request.referrer)
                );

                if (
                    requestCtx.headers.origin ||
                    (Service.meta.url.origin !== referer.origin &&
                        request.mode === 'cors')
                ) {
                    requestCtx.headers.origin = referer.origin;
                }

                requestCtx.headers.referer = referer.href;
            }

            const cookies = (await Service.cookie.getCookies(db)) || [];
            const cookieStr = Service.cookie.serialize(
                cookies,
                Service.meta,
                false
            );

            requestCtx.headers['user-agent'] = navigator.userAgent;

            if (cookieStr) requestCtx.headers.cookie = cookieStr;

            const reqEvent = new HookEvent(requestCtx, null, null);
            this.emit('request', reqEvent);

            if (reqEvent.intercepted) return reqEvent.returnValue;

            fetchedURL = requestCtx.blob
                ? 'blob:' + location.origin + requestCtx.url.pathname
                : requestCtx.url;

            const response = await this.bareClient.fetch(fetchedURL, {
                headers: requestCtx.headers,
                method: requestCtx.method,
                body: requestCtx.body,
                credentials: requestCtx.credentials,
                mode:
                    location.origin !== requestCtx.address.origin
                        ? 'cors'
                        : requestCtx.mode,
                cache: requestCtx.cache,
                redirect: requestCtx.redirect,
            });

            const responseCtx = new ResponseContext(requestCtx, response);
            const resEvent = new HookEvent(responseCtx, null, null);

            this.emit('beforemod', resEvent);
            if (resEvent.intercepted) return resEvent.returnValue;

            for (const name of cspHeaders) {
                if (responseCtx.headers[name]) delete responseCtx.headers[name];
            }

            if (responseCtx.headers.location) {
                responseCtx.headers.location = Service.rewriteUrl(
                    responseCtx.headers.location
                );
            }

            // downloads
            if (request.destination === 'document') {
                const header = responseCtx.headers['content-disposition'];

                // validate header and test for filename
                if (!/\s*?((inline|attachment);\s*?)filename=/i.test(header)) {
                    // if filename= wasn't specified then maybe the remote specified to download this as an attachment?
                    // if it's invalid then we can still possibly test for the attachment/inline type
                    const type = /^\s*?attachment/i.test(header)
                        ? 'attachment'
                        : 'inline';

                    // set the filename
                    const [filename] = new URL(response.finalURL).pathname
                        .split('/')
                        .slice(-1);

                    responseCtx.headers[
                        'content-disposition'
                    ] = `${type}; filename=${JSON.stringify(filename)}`;
                }
            }

            if (responseCtx.headers['set-cookie']) {
                Promise.resolve(
                    Service.cookie.setCookies(
                        responseCtx.headers['set-cookie'],
                        db,
                        Service.meta
                    )
                ).then(() => {
                    self.clients.matchAll().then(function (clients) {
                        clients.forEach(function (client) {
                            client.postMessage({
                                msg: 'updateCookies',
                                url: Service.meta.url.href,
                            });
                        });
                    });
                });
                delete responseCtx.headers['set-cookie'];
            }

            if (responseCtx.body) {
                switch (request.destination) {
                    case 'script':
                    case 'worker':
                        {
                            // craft a JS-safe list of arguments
                            const scripts = [
                                Service.bundleScript,
                                Service.clientScript,
                                Service.configScript,
                                Service.handlerScript,
                            ]
                                .map((script) => JSON.stringify(script))
                                .join(',');
                            responseCtx.body = `if (!self.selfindex && self.importScripts) { ${Service.createJsInject(
                                this.address,
                                this.bareClient.data,
                                Service.cookie.serialize(
                                    cookies,
                                    Service.meta,
                                    true
                                ),
                                request.referrer
                            )} importScripts(${scripts}); }\n`;
                            responseCtx.body += Service.js.rewrite(
                                await response.text()
                            );
                        }
                        break;
                    case 'style':
                        responseCtx.body = Service.rewriteCSS(
                            await response.text()
                        );
                        break;
                    case 'iframe':
                    case 'document':
                        if (
                            isHtml(
                                Service.meta.url,
                                responseCtx.headers['content-type'] || ''
                            )
                        ) {
                            responseCtx.body = Service.rewriteHtml(
                                await response.text(),
                                {
                                    document: true,
                                    injectHead: Service.createHtmlInject(
                                        Service.handlerScript,
                                        Service.bundleScript,
                                        Service.clientScript,
                                        Service.configScript,
                                        this.address,
                                        this.bareClient.data,
                                        Service.cookie.serialize(
                                            cookies,
                                            Service.meta,
                                            true
                                        ),
                                        request.referrer
                                    ),
                                }
                            );
                        }
                }
            }

            if (requestCtx.headers.accept === 'text/event-stream') {
                responseCtx.headers['content-type'] = 'text/event-stream';
            }

            this.emit('response', resEvent);
            if (resEvent.intercepted) return resEvent.returnValue;

            return new Response(responseCtx.body, {
                headers: responseCtx.headers,
                status: responseCtx.status,
                statusText: responseCtx.statusText,
            });
        } catch (err) {
            if (!['document', 'iframe'].includes(request.destination))
                return new Response(undefined, { status: 500 });

            console.error(err);

            return renderError(err, fetchedURL, this.address);
        }
    }
    static Service = Service;
}

self.ServiceWorker = ServiceWorker;

class ResponseContext {
    /**
     *
     * @param {RequestContext} request
     * @param {import("@tomphttp/bare-client").BareResponseFetch} response
     */
    constructor(request, response) {
        this.request = request;
        this.raw = response;
        this.Service = request.Service;
        this.headers = {};
        // eg set-cookie
        for (const key in response.rawHeaders)
            this.headers[key.toLowerCase()] = response.rawHeaders[key];
        this.status = response.status;
        this.statusText = response.statusText;
        this.body = response.body;
    }
    get url() {
        return this.request.url;
    }
    get base() {
        return this.request.base;
    }
    set base(val) {
        this.request.base = val;
    }
}

class RequestContext {
    /**
     *
     * @param {Request} request
     * @param {ServiceWorker} worker
     * @param {Service} Service
     * @param {BodyInit} body
     */
    constructor(request, worker, Service, body = null) {
        this.Service = Service;
        this.request = request;
        this.headers = Object.fromEntries(request.headers.entries());
        this.method = request.method;
        this.address = worker.address;
        this.body = body || null;
        this.cache = request.cache;
        this.redirect = request.redirect;
        this.credentials = 'omit';
        this.mode = request.mode === 'cors' ? request.mode : 'same-origin';
        this.blob = false;
    }
    get url() {
        return this.Service.meta.url;
    }
    set url(val) {
        this.Service.meta.url = val;
    }
    get base() {
        return this.Service.meta.base;
    }
    set base(val) {
        this.Service.meta.base = val;
    }
}

function isHtml(url, contentType = '') {
    return (
        (
            Service.mime.contentType(contentType || url.pathname) ||
            'text/html'
        ).split(';')[0] === 'text/html'
    );
}

class HookEvent {
    #intercepted;
    #returnValue;
    constructor(data = {}, target = null, that = null) {
        this.#intercepted = false;
        this.#returnValue = null;
        this.data = data;
        this.target = target;
        this.that = that;
    }
    get intercepted() {
        return this.#intercepted;
    }
    get returnValue() {
        return this.#returnValue;
    }
    respondWith(input) {
        this.#returnValue = input;
        this.#intercepted = true;
    }
}

/**
 *
 * @param {string} fetchedURL
 * @param {string} bareServer
 * @returns
 */
function hostnameErrorTemplate(fetchedURL, bareServer) {
    const parsedFetchedURL = new URL(fetchedURL);
    const script =
        `remoteHostname.textContent = ${JSON.stringify(
            parsedFetchedURL.hostname
        )};` +
        `bareServer.href = ${JSON.stringify(bareServer)};` +
        `uvHostname.textContent = ${JSON.stringify(location.hostname)};` +
        `reload.addEventListener("click", () => location.reload());` +
        `uvVersion.textContent = ${JSON.stringify(
            process.env.Service_VERSION
        )};`;

    return (
        '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
        "<meta charset='utf-8' />" +
        '<title>Error</title>' +
        '</head>' +
        '<body>' +
        '<h1>This site can’t be reached</h1>' +
        '<hr />' +
        '<p><b id="remoteHostname"></b>’s server IP address could not be found.</p>' +
        '<p>Try:</p>' +
        '<ul>' +
        '<li>Verifying you entered the correct address</li>' +
        '<li>Clearing the site data</li>' +
        '<li>Contacting <b id="uvHostname"></b>\'s administrator</li>' +
        "<li>Verifying the <a id='bareServer' title='Bare server'>Bare server</a> isn't censored</li>" +
        '</ul>' +
        '<button id="reload">Reload</button>' +
        '<hr />' +
        '<p><i>Service v<span id="uvVersion"></span></i></p>' +
        `<script src="${
            'data:application/javascript,' + encodeURIComponent(script)
        }"></script>` +
        '</body>' +
        '</html>'
    );
}

/**
 *
 * @param {string} title
 * @param {string} code
 * @param {string} id
 * @param {string} message
 * @param {string} trace
 * @param {string} fetchedURL
 * @param {string} bareServer
 * @returns
 */
function errorTemplate(
    title,
    code,
    id,
    message,
    trace,
    fetchedURL,
    bareServer
) {
    // produced by bare-server-node
    if (message === 'The specified host could not be resolved.')
        return hostnameErrorTemplate(fetchedURL, bareServer);

    // turn script into a data URI so we don't have to escape any HTML values
    const script =
    `errorTitle.textContent = ${JSON.stringify(title)};` +
    `errorCode.textContent = ${JSON.stringify(code)};` +
    (id ? `errorId.textContent = ${JSON.stringify(id)};` : '') +
    `errorMessage.textContent =  ${JSON.stringify(message)};` +
    `errorTrace.value = ${JSON.stringify(trace)};` +
    `fetchedURL.textContent = ${JSON.stringify(fetchedURL)};` +
    `bareServer.href = ${JSON.stringify(bareServer)};` +
    `for (const node of document.querySelectorAll("#uvHostname")) node.textContent = ${JSON.stringify(
        location.hostname
    )};` +
    `reload.addEventListener("click", () => location.reload());` +
    `uvVersion.textContent = ${JSON.stringify(
        process.env.Service_VERSION
    )};`;

return `
<html>
  <center>
    <div style="margin-top: 20px;">
      <h2 style="font-size: 24px;">The service worker was not properly registered. Please go back to the home page.</h2>
      <button id="registerSWButton" style="padding: 10px 20px; font-size: 16px;">Register Service Worker</button>
    </div>
    <script>
      if ("serviceWorker" in navigator) {
        const registerSWButton = document.getElementById("registerSWButton");
        registerSWButton.addEventListener("click", async () => {
          try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            console.log("Service Worker registered:", registration);
          } catch (error) {
            console.error("Failed to register Service Worker:", error);
          }
        });
      } else {
        console.log("Service Worker is not supported.");
      }
    </script>
  </center>
</html>`;
    }

/**
 * @typedef {import("@tomphttp/bare-client").BareError} BareError
 */

/**
 *
 * @param {unknown} err
 * @returns {err is BareError}
 */
function isBareError(err) {
    return err instanceof Error && typeof err.body === 'object';
}

/**
 *
 * @param {unknown} err
 * @param {string} fetchedURL
 * @param {string} bareServer
 */
function renderError(err, fetchedURL, bareServer) {
    /**
     * @type {number}
     */
    let status;
    /**
     * @type {string}
     */
    let title;
    /**
     * @type {string}
     */
    let code;
    let id = '';
    /**
     * @type {string}
     */
    let message;

    if (isBareError(err)) {
        status = err.status;
        title = 'Error communicating with the Bare server';
        message = err.body.message;
        code = err.body.code;
        id = err.body.id;
    } else {
        status = 500;
        title = 'Error processing your request';
        message = 'Internal Server Error';
        code = err instanceof Error ? err.name : 'UNKNOWN';
    }

    return new Response(
        errorTemplate(
            title,
            code,
            id,
            message,
            String(err),
            fetchedURL,
            bareServer
        ),
        {
            status,
            headers: {
                'content-type': 'text/html',
            },
        }
    );
}