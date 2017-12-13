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
const { singular } = require('pluralize')
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
  { example: errorEx.line('Your user agent should take the form %s') }
)
const TooManySearchParametersError = errorEx("TooManySearchParametersError",
  { message : "A GET request should have either an entity ID, or search query. Not both." }
)
const NonFilterableFieldError = errorEx("NonFilterableFieldError",
  { query : errorEx.line("The query filter \'%s\' uses a field that is not filterable for the endpoint.") }
)
const HTTPStatusError = errorEx("HTTPStatusError", {
  statusCode : errorEx.append("HTTP status code: %s"),
  statusMessage : errorEx.append("(%s)")
})
const NestedOnlyEndpointError = errorEx("NestedOnlyEndpointError", {
  path : errorEx.append("The path '%s' can only be called as a nested resource (i.e. behind some other resource). Go double-check the API docs.")
})
const NoBodySuppliedError = errorEx("NoBodySuppliedError")
const NonIntegerIDError = errorEx("NonIntegerIDError")
const ValidationFailedError = errorEx("ValidationFailedError", {
  field: errorEx.append("Validation of field '%s' failed:"),
  description: errorEx.append("%s")
})
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
const prepareSearch = (search_parts, allowed) => {
  // First argument is the string query
  const args = arguments
  const [query] = search_parts
  const fieldInQuery = field => query.includes(field)
  // Check that the field contain in query is allowed for the endpoint
  if (!allowed.find(fieldInQuery)) {
    const err = new NonFilterableFieldError()
    err.query = query
    throw err
  }
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
 *
 */
const buildSearch = ( search, allowed )  => {
  return search.reduce((acc, search_parts) => {
    acc.push('q[]=' + prepareSearch(search_parts, allowed))
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
const factory = {
  list: (self, path, entity, filters) => {
    return function() {
      let [opts] = arguments
      if (opts === undefined) {
        opts = {}
      }
      // Store these items in the query summary
      Object.assign(self.query_summary, opts, {
        started_at: new Date()
      })
      // Pull out search stuff for _list()
      const {
        search = [],
        per_page = DEFAULT_PER_PAGE,
        page = DEFAULT_PAGE,
        follow = false
      } = opts
      // Begin
      return self._list({ path, entity, filters, search, per_page, page, follow })
    }
  },
  get: (self, path) => {
    return function() {
      let [id] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === "string") {
        id = parseInt(id, 10)
      }
      return self._get({ path, id })
    }
  },
  create: (self, path) => {
    return function() {
      let [body] = arguments
      if (typeof body !== "object") {
        let err = new NoBodySuppliedError()
        throw err
      }
      // Validation of all properties
      return self._create({ path, body })
    }
  },
  delete: (self, path) => {
    return function() {
      let [id] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === "string") {
        id = parseInt(id, 10)
      }
      return self._delete({ path, id })
    }
  },
  update: (self, path) => {
    return function() {
      let [id, body] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === "string") {
        id = parseInt(id, 10)
      }
      if (typeof body !== "object") {
        let err = new NoBodySuppliedError()
        throw err
      }
      // Validation of all properties
      return self._update({ path, id, body })
    }
  },
  archive: (self, path) => {
    return function() {
      let [id] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === "string") {
        id = parseInt(id, 10)
      }
      return self._archive({ path, id })
    }
  },
  unarchive: (self, path) => {
    return function() {
      let [id] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === "string") {
        id = parseInt(id, 10)
      }
      return self._unarchive({ path, id })
    }
  },
  cancel: (self, path) => {
    return function() {
      let [id] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === "string") {
        id = parseInt(id, 10)
      }
      return self._cancel({ path, id })
    }
  },
  unavailable: (self, path) => {
    return function() {
      const err = new NestedOnlyEndpointError()
      err.path = path
      throw err
    }
  }
}
/**
 * Trun endpoints into functions
 * @param  {[type]} self     [description]
 * @param  {[type]} endpoint [description]
 * @return {[type]}          [description]
 */
const functionise = (self, endpoint) => {
  // For each endpoint, build out the functions it exposes
  return endpoint.methods.reduce((obj, method) => {
    // Pull out what we need
    const {
      name,
      entity = null,
      path,
      filters = [],
      nested_only = false,
      pluralise = true,
      singularise = true
    } = endpoint

    // Build function name. For nested functions (/group_appointments/:id/attendees)
    // we generate a decorator to use for clarity.
    // e.g. groupAppointments(id).getAttendees()
    if (nested_only) {
      let fnName = _.camelCase(`${method} ${name}`)
      obj[fnName] = factory.unavailable(self, method, path, entity, filters)
    }
    // For endpoints that allow singular ID access, build the function.
    if (["get", "create", "update", "delete", "cancel", "archive", "unarchive"].includes(method)) {
      let fnName = _.camelCase(`${method} ${singular(name)}`)
      obj[fnName] = factory[method](self, path)
    }
    // If this is not a GET factory call,
    // then just return what we've created
    if (!["get", "list"].includes(method))
      return obj
    // Do we need a list get?
    if (method === "list") {
      let fnName = _.camelCase(`get ${name}`)
      obj[fnName] = factory.list(self, path, entity, filters)
    }
    // If the endpoint doesn't have any nested paths,
    // then just return what we've created
    if (!endpoint.nested)
      return obj
    // If this endpoint is available as a nested resource too, then
    // we need to create the nesting functions. These will always be
    // for a given entity ID, e.g. individualAppointment(123456).getAttendees()
    Object.assign(obj, endpoint.nested.reduce((obj, nested) => {
      const nestedFnName = _.camelCase(`${singular(nested.name)}`)
      obj[nestedFnName] = function(id) {
        if (id === undefined) {
          let err = new NoIdSuppliedError()
          throw err
        }
        if (typeof id === "string") {
          try{
            id = parseInt(id, 10)
          } catch(e) {
            throw new NonIntegerIDError()
          }
        }
        const nested_path = nested.path.replace(":id", id) + endpoint.path
        let fnName = _.camelCase(`get ${name}`)
        let fn = {}
        fn[fnName] = factory.list(self, nested_path, entity, filters)
        return fn
      }
      return obj
    }, {}))
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
  // Query summary
  this.query_summary = {
    search: [],
    per_page: DEFAULT_PER_PAGE,
    page: DEFAULT_PAGE,
    follow: false,
    total_records: 0,
    started_at: null,
    ended_at: null,
    seconds: 0
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
        // If straight up error, reject
        if (err) return reject(err)
        // Status codes in the 4** range.
        if (response.statusCode >= 400 && response.statusCode < 500) {
          const httpErr = new HTTPStatusError()
          httpErr.statusCode = response.statusCode
          httpErr.statusMessage = response.statusMessage
          return reject(httpErr)
        }
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
  this._list = function({ path, entity, search, per_page, page, follow, filters }) {
    const method = "get"
    let qs = [
      buildPage(page),
      buildPerPage(per_page),
      buildSearch(search, filters)
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
            // Tie off the summary object, and return
            const ended_at = new Date()
            Object.assign(this.query_summary, {
              total_records: entity ? records.length : 1,
              ended_at,
              seconds: moment(ended_at).diff(this.query_summary.started_at, 'seconds')
            })
            // If we have records, then we're not using the callback, so resolve
            // the promise
            if (useOnDone) {
              onDone(this.query_summary)
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
      // Start
      return next(url)
    }.bind(this))
  }
  /**
   * PUT
   */
  this._update = function({ path, id, body }) {
    const method = "put"
    const url = CLINIKO_API_BASE + appendId(path, id)
    return this._doRequest({ method, url, body })
  }
  /**
   * POST
   */
  this._create = function({ path, body }) {
    const method = "post"
    const url = CLINIKO_API_BASE + path
    return this._doRequest({ method, url, body })
  }
  /**
   * DELETE
   */
  this._delete = function({ path, id }) {
    const method = "delete"
    const url = CLINIKO_API_BASE + appendId(path, id)
    return this._doRequest({ method, url })
  }
  /**
   * ARCHIVE
   */
  this._archive = function({ path, id }) {
    const method = "post"
    const url = CLINIKO_API_BASE + appendId(path, id) + "/archive"
    return this._doRequest({ method, url })
  }
  this._unarchive = function({ path, id }) {
    const method = "post"
    const url = CLINIKO_API_BASE + appendId(path, id) + "/unarchive"
    return this._doRequest({ method, url })
  }
  /**
   * CANCEL
   */
  this._cancel = function({ path, id }) {
    const method = "patch"
    const url = CLINIKO_API_BASE + appendId(path, id) + "/cancel"
    return this._doRequest({ method, url })
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
  this.summary = function() {
    return this.query_summary
  }
  // Add in all of the functions we need
  const fns = ENDPOINTS.reduce(function(obj, endpoint) {
    return Object.assign(obj, functionise(this, endpoint))
  }.bind(this), {})
  Object.assign(this, fns)
}
