// NodeJS gets stropy with non-standard HEADER responses.
// Apparently this library can resolve it. However, you have
// to monkey patch the http_parser for it to work, so require it
// before request.
process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser
const errorEx = require('error-ex')
const request = require('request')
const jitter = require('promise-retry')
const moment = require('moment')
const _      = require('lodash')
const DEFAULT_RETRY_OPTS = {
  retries: 2,
  factor: 2,
  randomize: true
}
const ENDPOINTS = require('./lib/endpoints')
const USER_AGENT_EXAMPLE = "Your Name/Company (you@email.com)"
const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 50
const CLINIKO_API_BASE = "https://api.cliniko.com/v1"
/**
 * Operators are carefully ordered to ensure that search term formatting
 * doesn't trip up on repeated characters. e.g. the character > is repeated
 * in the conditional <> >= and >. So when searching, we should eliminate
 * those first conditionals.
 * See 'formatSearch' for implementation.
 */
const OPERATORS = [
  { std: '<=', mod : ':<=' },
  { std: '>=', mod : ':>=' },
  { std: '~~', mod : ':~~' },
  { std: '!=', mod : ':!=' },
  { std: '<>', mod : ':!=' },
  { std: '<', mod : ':<' },
  { std: '>', mod : ':>' },
  { std: '=', mod : ':=' },
  { std: '~', mod : ':~' }
]
// Errors
const NoAPIKeyError = errorEx("NoAPIKeyError")
const NoUserAgentError = errorEx("NoUserAgentError",
  { example: errorEx.line('\'Your user agent should take the form %s\'') }
)
const TooManySearchParametersError = errorEx("TooManySearchParametersError",
  { message : "A GET request should have either an entity ID, or search query. Not both." }
)
/**
 * Format a query string condition
 * @param  {[type]} search [description]
 * @return {[type]}        [description]
 */
const formatSearch = search => {

  // Remove any colon operators
  const mod = OPERATORS.find(op => search.includes(op.mod))
  if (mod) {
    search = search.replace(mod.mod, mod.std)
  }
  // Returns just the formatted search, after looking through all operators
  const op = OPERATORS.find(op => search.includes(op.std))
  const index = search.indexOf(op.std)
  const left = search.slice(0, index)
  const right = search.slice(index+op.std.length)
  const formatted = [left.trim(), op.mod, right.trim()].join("")
  return formatted
}
/**
 * Format a query string condition
 * @param  {[type]} search [description]
 * @return {[type]}        [description]
 */
const prepareSearch = search_parts => {
  // First argument is the string query
  const args = arguments
  const [query] = search_parts
  const values = Array.prototype.slice.call(search_parts, 1)
  const search = formatSearch(values.reduce((query, value) => {
    if (value instanceof Date) {
      return query.replace("?", moment(value).utc().format("YYYY-MM-DDTHH:mm:ss[Z]"))
    }
    return query.replace("?", value)
  }, query))
  return search
}
/**
 * Get the Cliniko settings data
 * @param  {[type]} api_key    [description]
 * @return {[type]}            [description]
 */
const buildSearch = search  => {
  return search.reduce((acc, search_parts) => {
    acc.push('q[]=' + prepareSearch(search_parts))
    return acc
  }, []).join("&")
}
const buildPerPage = per_page => {
  return ( per_page ? `per_page=${per_page}` : '')
}
const buildPage = page => {
  return ( page ? `page=${page}` : '')
}
/**
 * Create a path with the id
 */
const appendId = ( uri, id ) => {
  return [uri, "/", id].join("")
}
/**
 * Trun endpoints into functions
 * @param  {[type]} self     [description]
 * @param  {[type]} endpoint [description]
 * @return {[type]}          [description]
 */
const functionise = (self, endpoint) => {
  return endpoint.methods.reduce((obj, method) => {
    const { name, entity = null, path } = endpoint
    let fnName = _.camelCase(`${method} ${name}`)
    obj[fnName] = function(){
      let [opts] = arguments
      if (opts === undefined) {
        opts = {}
      }
      if (typeof opts === "string") {
        opts = parseInt(opts, 10)
      }
      if (typeof opts === "number") {
        let id = opts
        return this._get({ path, id })
      }
      const {
        search,
        per_page = DEFAULT_PER_PAGE,
        page = DEFAULT_PAGE,
        follow = false
      } = opts
      return this._list({ path, entity, search, per_page, page, follow })
    }.bind(self)
    return obj
  }, {})
}
/**
 * Our Cliniko object. Initialised on each usage with 'new'.
 * Didn't opt for the modern class implementation. Good ol' functions will do.
 * @param  {[type]} api_key    [description]
 * @param  {[type]} user_agent [description]
 * @param  {[type]} retries    [description]
 * @return {[type]}            [description]
 */
const Cliniko = exports.Cliniko = function({ api_key, user_agent, retries }) {
  // Set up the object for event callbacks
  this.callbacks = {
    data: null,
    done: null,
    error: null
  }
  // Our trties limits
  this.retries = retries || DEFAULT_RETRY_OPTS.retries
  // if an API key or user agent isn't supplied, don't continue. These are mandatory.
  if(!api_key || api_key === null || typeof api_key !== "string") throw new NoAPIKeyError()
  if(!user_agent || user_agent === null || typeof user_agent !== "string") {
    let error = new NoUserAgentError()
    error.example = USER_AGENT_EXAMPLE
    throw error
  }
  this.api_key = api_key.trim()
  this.user_agent = user_agent.trim()
  /**
   * Request
   */
  this._request = function({ method, url, body }) {
    return new Promise(function( resolve, reject ) {
      const options = {
        method,
        url,
        auth: {
          username: this.api_key,
          password: "",
          sendImmediately: true
        },
        headers: {
          'User-Agent': this.user_agent,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        json: body || true
      }
      // Run the HTTP request
      request(options, function(err, response, json) {
        if (err) return reject(err)
        // Resolve withe JSON response, or with an empty object
        return resolve( !json || json === null ? {} : json)
      })
    }.bind(this))
  }
  /**
   * Request wrapper with Jitter retries
   */
  this._doRequest = function({ method, url, body }) {
    return new Promise(function(resolve, reject) {
      // Submit with Jitter retry
      jitter(Object.assign({}, DEFAULT_RETRY_OPTS, {
        retires : this.retries
      }), function(retry, number) {
        return this._request({ method, url, body })
        .catch(retry)
      }.bind(this))
      .then(resolve, reject)
    }.bind(this))
  }
  /**
   * GET
   */
  this._get = function({ path, id }) {
    const method = "get"
    const url = CLINIKO_API_BASE + appendId(path, id) + "?"
    return this._doRequest({ method, url })
  }
  /*
   * GET, but searcing
   */
  this._list = function({ path, entity, search, per_page, page, follow }) {
    const method = "get"
    let qs = [
      buildPage(page),
      buildPerPage(per_page),
      buildSearch(search)
    ].join("&")
    let url = CLINIKO_API_BASE + path + ( qs.length ? "?" + qs : "")
    const onData = this.callbacks.data
    const useOnData = typeof onData === "function"
    const onError = this.callbacks.error
    const useOnError = typeof onError === "function"
    const onDone = this.callbacks.done
    const useOnDone = typeof onDone === "function"
    return new Promise(function(resolve, reject) {
      // If this enpoint has an entity name for its search results,
      // then we need to collect results into an array.
      // Otherwise, just return an object
      let records = entity ? [] : {}
      const next = function(url) {
        this._doRequest({ method, url })
          .then(function(json){
            // If we have an entity name, then the JSON results are an
            // property array, e.g.
            // { patients: [ { ... }, { ... } ] }
            // If not, then the results are just an object
            // { ... }
            // If there's an on data callback, send the records there
            if (useOnData) {
              // if there's an entity type for the endpoint,
              // an array of records will be returned
              // sitting at the entity property in the object
              onData(entity ? json[entity] : json)
            }
            // If we have an entity name, then our search results are an
            // array behind a property
            if (entity) {
              // Otherwise, add them to a big array
              records.splice(records.length, 0, ...json[entity])
            }
            // Are there more records? and are we following on?
            if (follow && json.links.next) {
              return next(json.links.next)
            }
            // If we have records, then we're not using the callback, so resolve
            // the promise
            if (useOnDone) {
              onDone({ path, search, per_page, page, follow })
              return resolve(null)
            }
            // If we're not using the onDone callback, return the records
            // either as a combined array, or the JSON object
            return resolve(entity ? records : json)
          }.bind(this))
          .catch(function(err) {
            if (useOnError) {
              onError(err)
              return resolve(null)
            }
            return reject(err)
          }.bind(this))
      }.bind(this)
      return next(url)
    }.bind(this))
  }
  /**
   * PUT
   */
  this._put = function({ path, id, body }) {
    const method = "put"
    return this._doRequest({ method, path, id, body })
  }
  /**
   * POST
   */
  this._post = function({ path, body }) {
    const method = "post"
    return this._doRequest({ method, path, body })
  }
  /**
   * DELETE
   */
  this._delete = function({ path, body }) {
    const method = "delete"
    return this._doRequest({ method, path, id })
  }
  /**
   * When an event is emited
   * @param  {[type]}   name     [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  this.on = function(name, callback) {
    this.callbacks[name] = callback
  }
  // Add in all of the functions we need
  const fns = ENDPOINTS.reduce(function(obj, endpoint) {
    return Object.assign(obj, functionise(this, endpoint))
  }.bind(this), {})
  Object.assign(this, fns)
}
