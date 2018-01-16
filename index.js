// NodeJS gets stropy with non-standard HEADER responses.
// Apparently this library can resolve it. However, you have
// to monkey patch the http_parser for it to work, so require it
// before request.
process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser
const errorEx = require('error-ex')
const request = require('request')
const jitter = require('promise-retry')
const moment = require('moment')
const _ = require('lodash')
const { singular } = require('pluralize')
const DEFAULT_RETRY_OPTS = {
  retries: 2,
  factor: 2,
  randomize: true
}
const Formatter = require('./lib/formatter').Formatter
const ENDPOINTS = require('./lib/endpoints')
const USER_AGENT_EXAMPLE = 'Your Name/Company (you@email.com)'
const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 50
const CLINIKO_API_BASE = 'https://api.cliniko.com/v1'
const RETAIN_FIELDS = true
/**
 * Operators are carefully ordered to ensure that search term formatting
 * doesn't trip up on repeated characters. e.g. the character > is repeated
 * in the conditional <> >= and >. So when searching, we should eliminate
 * those first conditionals.
 * See 'formatSearch' for implementation.
 */
const OPERATORS = [
  { std: '<=', mod: ':<=' },
  { std: '>=', mod: ':>=' },
  { std: '~~', mod: ':~~' },
  { std: '!=', mod: ':!=' },
  { std: '<>', mod: ':!=' },
  { std: '<', mod: ':<' },
  { std: '>', mod: ':>' },
  { std: '=', mod: ':=' },
  { std: '~', mod: ':~' }
]
// Errors
const NoAPIKeyError = errorEx('NoAPIKeyError')
const NoUserAgentError = errorEx('NoUserAgentError',
  { example: errorEx.line('Your user agent should take the form %s') }
)
const HTTPStatusError = errorEx('HTTPStatusError', {
  statusCode: errorEx.append('HTTP status code: %s'),
  statusMessage: errorEx.append('(%s)')
})
const NestedOnlyEndpointError = errorEx('NestedOnlyEndpointError', {
  path: errorEx.append('The path \'%s\' can only be called as a nested resource (i.e. behind some other resource). Go double-check the API docs.')
})
const NoBodySuppliedError = errorEx('NoBodySuppliedError')
const NonIntegerIDError = errorEx('NonIntegerIDError')
const NoIdSuppliedError = errorEx('NoIdSuppliedError')

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
  const right = search.slice(index + op.std.length)
  const formatted = [left.trim(), op.mod, right.trim()].join('')
  return formatted
}
/**
 * Turns links in records to Id values
 * @param  {[type]} records [description]
 * @param  {[type]} fields  [description]
 * @return {[type]}         [description]
 */
const delink = (records, link_fields) => {
  // Init a new Helper. Given the fields of the endpoint, this is going
  // to do much of the preparation work for us.
  const formatter = new Formatter(link_fields)
  // Formatter interface function
  const format = record => formatter.delink(record)
  // Our scope array for all new records
  if (_.isArray(records)) { return records.map(format) } else if (_.isObject(records)) { return [records].map(format)[0] } else { return records }
}
/**
 * Format a query string condition
 * @param  {[type]} search [description]
 * @return {[type]}        [description]
 */
const prepareSearch = (search_parts) => {
  // First argument is the string query
  const [query] = search_parts
  const values = Array.prototype.slice.call(search_parts, 1)
  const search = formatSearch(values.reduce((query, value) => {
    if (value instanceof Date) {
      return query.replace('?', moment(value).utc().format('YYYY-MM-DDTHH:mm:ss[Z]'))
    }
    return query.replace('?', value)
  }, query))
  return search
}
/**
 *
 */
const buildSearch = (search, allowed) => {
  return search.reduce((acc, search_parts) => {
    const [query] = search_parts
    const fieldInQuery = field => query.includes(field)
    // Check that the field contain in query is allowed for the endpoint
    // If not, don't add it in
    if (allowed.find(fieldInQuery)) {
      acc.push('q[]=' + prepareSearch(search_parts, allowed))
    }
    return acc
  }, []).join('&')
}
const buildPerPage = per_page => {
  return (per_page ? `per_page=${per_page}` : '')
}
const buildPage = page => {
  return (page ? `page=${page}` : '')
}
/**
 * Generate a path which includes the ID.
 * In some cases, we generate a path where the ID is not supplied.
 * Typically, that's not okay - why build a path for a single entity
 * that doesn't have an ID - but there are scenarios for nested resources
 * where we are generically expecting to append an ID, but no ID is available.
 */
const appendId = (uri, id) => {
  // Handle the case where the ID isn't supplied (no '/' required.)
  if (id) { return [uri, '/', id].join('') }
  return uri
}
const factory = {
  list: (self, path, entity, filters, delink) => {
    return function () {
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
      return self._list({ path, entity, filters, search, per_page, page, follow, delink })
    }
  },
  get: (self, path, delink, { no_id }) => {
    return function () {
      let [id] = arguments
      if (id === undefined && !no_id) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === 'string') {
        id = parseInt(id, 10)
      }
      return self._get({ path, id, delink })
    }
  },
  create: (self, path, delink) => {
    return function () {
      let [body] = arguments
      if (typeof body !== 'object') {
        let err = new NoBodySuppliedError()
        throw err
      }
      // Validation of all properties
      return self._create({ path, body, delink })
    }
  },
  delete: (self, path) => {
    return function () {
      let [id] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === 'string') {
        id = parseInt(id, 10)
      }
      return self._delete({ path, id })
    }
  },
  update: (self, path, delink) => {
    return function () {
      let [id, body] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === 'string') {
        id = parseInt(id, 10)
      }
      if (typeof body !== 'object') {
        let err = new NoBodySuppliedError()
        throw err
      }
      // Validation of all properties
      return self._update({ path, id, body, delink })
    }
  },
  archive: (self, path, delink) => {
    return function () {
      let [id] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === 'string') {
        id = parseInt(id, 10)
      }
      return self._archive({ path, id, delink })
    }
  },
  unarchive: (self, path, delink) => {
    return function () {
      let [id] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === 'string') {
        id = parseInt(id, 10)
      }
      return self._unarchive({ path, id, delink })
    }
  },
  cancel: (self, path, delink) => {
    return function () {
      let [id] = arguments
      if (id === undefined) {
        let err = new NoIdSuppliedError()
        throw err
      }
      if (typeof id === 'string') {
        id = parseInt(id, 10)
      }
      return self._cancel({ path, id, delink })
    }
  },
  unavailable: (self, path) => {
    return function () {
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
      no_id = false,
      links = []
    } = endpoint
    // Delink function factory
    const delinkFn = (records, should) => {
      return (should ? delink(records, links) : records)
    }
    // Build function name. For nested functions (/group_appointments/:id/attendees)
    // we generate a decorator to use for clarity.
    // e.g. groupAppointments(id).getAttendees()
    if (method === 'get' && nested_only) {
      let fnName = _.camelCase(`${method} ${singular(name)}`)
      obj[fnName] = factory.unavailable(self, path)
    } else if (method === 'get' && no_id) {
      let fnName = _.camelCase(`${method} ${name}`)
      // When building the function, at least for GET, there are endpoints that
      // need a singular get (e.g. getReferralSource) whithout the need of an ID.
      // Case in point is patients. A patient has one referral source and only one.
      // patient(123456).getReferralSource()
      // There's no need for an ID in getReferralSource() as this is a unique resource
      // against the patient.
      obj[fnName] = factory[method](self, path, delinkFn, { no_id })
      // For endpoints that allow singular ID access, build the function.
    } else if (['get', 'create', 'update', 'delete', 'cancel', 'archive', 'unarchive'].includes(method)) {
      let fnName = _.camelCase(`${method} ${singular(name)}`)
      // When building the function, at least for GET, there are endpoints that
      // need a singular get (e.g. getReferralSource) whithout the need of an ID.
      // Case in point is patients. A patient has one referral source and only one.
      // patient(123456).getReferralSource()
      // There's no need for an ID in getReferralSource() as this is a unique resource
      // against the patient.
      obj[fnName] = factory[method](self, path, delinkFn, { no_id })
    }
    // If this is not a GET factory call,
    // then just return what we've created
    if (!['get', 'list'].includes(method)) { return obj }
    // Do we need a list get?
    if (method === 'list') {
      let fnName = _.camelCase(`get ${name}`)
      obj[fnName] = factory.list(self, path, entity, filters, delinkFn)
    }
    // If this endpoint is available as a nested resource too, then
    // we need to create the nesting functions. These will always be
    // for a given entity ID, e.g. individualAppointment(123456).getAttendees()
    if (endpoint.nested) {
      Object.assign(obj, endpoint.nested.reduce((obj, nested) => {
        const nestedFnName = _.camelCase(`${singular(nested.name)}`)
        obj[nestedFnName] = function (id) {
          if (id === undefined) {
            let err = new NoIdSuppliedError()
            throw err
          }
          if (typeof id === 'string') {
            try {
              id = parseInt(id, 10)
            } catch (e) {
              throw new NonIntegerIDError()
            }
          }
          const nested_path = nested.path.replace(':id', id) + endpoint.path
          let fnName = _.camelCase(`get ${name}`)
          let fn = {}
          fn[fnName] = (
            method === 'get'
            ? factory.get(self, nested_path, delinkFn, { no_id })
            : factory.list(self, nested_path, entity, filters, delinkFn)
          )
          return fn
        }
        return obj
      }, {}))
    }
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
exports.Cliniko = function ({ api_key, user_agent, retries = DEFAULT_RETRY_OPTS.retries, delinkify = false }) {
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
  // Convert links to ids?
  this.delinkify = delinkify
  // Our retries limits
  this.retries = retries
  // if an API key or user agent isn't supplied, don't continue. These are mandatory.
  if (!api_key || api_key === null || typeof api_key !== 'string') throw new NoAPIKeyError()
  if (!user_agent || user_agent === null || typeof user_agent !== 'string') {
    let error = new NoUserAgentError()
    error.example = USER_AGENT_EXAMPLE
    throw error
  }
  this.api_key = api_key.trim()
  this.user_agent = user_agent.trim()
  /**
   * Request
   */
  this._request = function ({ method, url, body }) {
    return new Promise(function (resolve, reject) {
      const options = {
        method,
        url,
        auth: {
          username: this.api_key,
          password: '',
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
      request(options, function (err, response, json) {
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
        return resolve(!json ? null : json)
      })
    }.bind(this))
  }
  /**
   * Request wrapper with Jitter retries
   */
  this._doRequest = function ({ method, url, body }) {
    return new Promise(function (resolve, reject) {
      // Submit with Jitter retry
      jitter(Object.assign({}, DEFAULT_RETRY_OPTS, {
        retires: this.retries
      }), function (retry) {
        return this._request({ method, url, body })
        .catch(retry)
      }.bind(this))
      .then(resolve, reject)
    }.bind(this))
  }
  /**
   * GET
   */
  this._get = function ({ path, id, delink }) {
    return new Promise(function (resolve, reject) {
      const method = 'get'
      const url = CLINIKO_API_BASE + appendId(path, id) + '?'
      return this._doRequest({ method, url })
      .then(function (json) {
        if (this._useOnData()) {
          this.callbacks.data(delink(json, this.delinkify))
          return resolve(null)
        }
        // We're not using onData, so collect all records.
        // These will be returned with the promise is resolved.
        return resolve(delink(json, this.delinkify))
      }.bind(this))
      .catch(function (err) {
        if (this._useOnError()) {
          this.callbacks.error(err)
          return resolve(null)
        }
        return reject(err)
      }.bind(this))
    }.bind(this))
  }
  /*
   * GET, but searcing
   */
  this._list = function ({ path, entity, search, per_page, page, follow, filters, delink }) {
    return new Promise(function (resolve, reject) {
      const method = 'get'
      let qs = [
        buildPage(page),
        buildPerPage(per_page),
        buildSearch(search, filters)
      ].join('&')
      let url = CLINIKO_API_BASE + path + (qs.length ? '?' + qs : '')
    // If this enpoint has an entity name for its search results,
    // then we need to collect results into an array.
    // Otherwise, just return an object
      let records = []
      let total_records = 0
      let pages = 0
      let fields = []
      const next = function (url, save_fields) {
        this._doRequest({ method, url })
        .then(function (json) {
          // Keep a running total, as this will be emitted in the onDone
          // event.
          total_records += json[entity].length
          pages++
          // Results are returned to us. For list operations,
          // the results json is an object, with an array inside.
          // This array sits at the property with the entity name, e.g.
          // { patients: [ { ... }, { ... } ] }
          // If there's an on data callback, send the records there
          const delinked = delink(json[entity], this.delinkify)
          if (this._useOnData()) {
            // if there's an entity type for the endpoint,
            // an array of records will be returned
            // sitting at the entity property in the object
            this.callbacks.data(delinked)
          } else {
            // We're not using onData, so collect all records.
            // These will be returned with the promise is resolved.
            records.splice(records.length, 0, ...delinked)
          }
          // Do we need to save the JSON fields too?
          if (save_fields && delinked.length) {
            let rec = _.sample(delinked)
            fields = Object.keys(rec)
          }
          // Are there more records? and are we following on?
          if (follow && json.links.next) {
            return next(json.links.next)
          }
          // Tie off the summary object, and return
          const ended_at = new Date()
          Object.assign(this.query_summary, {
            fields,
            pages,
            total_records,
            ended_at,
            seconds: moment(ended_at).diff(this.query_summary.started_at, 'seconds')
          })
          // If we have records, then we're not using the callback, so resolve
          // the promise
          if (this._useOnDone()) {
            this.callbacks.done(this.query_summary)
            return resolve(null)
          }
          // If we're not using the onDone callback, return the records
          // either as a combined array, or the JSON object
          return resolve(records)
        }.bind(this))
        .catch(function (err) {
          if (this._useOnError()) {
            this.callbacks.error(err)
            return resolve(null)
          }
          return reject(err)
        }.bind(this))
      }.bind(this)
    // Start
      return next(url, RETAIN_FIELDS)
    }.bind(this))
  }
  /**
   * PUT
   */
  this._update = function ({ path, id, body, delink }) {
    return new Promise(function (resolve, reject) {
      const method = 'put'
      const url = CLINIKO_API_BASE + appendId(path, id)
      return this._doRequest({ method, url, body })
      .then(function (json) {
        if (this._useOnData()) {
          this.callbacks.data(delink(json, this.delinkify))
          return resolve(null)
        }
        // We're not using onData, so collect all records.
        // These will be returned with the promise is resolved.
        return resolve(delink(json, this.delinkify))
      }.bind(this))
      .catch(function (err) {
        if (this._useOnError()) {
          this.callbacks.error(err)
          return resolve(null)
        }
        return reject(err)
      }.bind(this))
    }.bind(this))
  }
  /**
   * POST
   */
  this._create = function ({ path, body }) {
    return new Promise(function (resolve, reject) {
      const method = 'post'
      const url = CLINIKO_API_BASE + path
      this._doRequest({ method, url, body })
      .then(resolve)
      .catch(reject)
    }.bind(this))
  }
  /**
   * DELETE
   */
  this._delete = function ({ path, id }) {
    return new Promise(function (resolve, reject) {
      const method = 'delete'
      const url = CLINIKO_API_BASE + appendId(path, id)
      this._doRequest({ method, url })
      .then(resolve)
      .catch(reject)
    }.bind(this))
  }
  /**
   * ARCHIVE
   */
  this._archive = function ({ path, id, delink }) {
    return new Promise(function (resolve, reject) {
      const method = 'post'
      const url = CLINIKO_API_BASE + appendId(path, id) + '/archive'
      return this._doRequest({ method, url })
      .then(function (json) {
        if (this._useOnData()) {
          this.callbacks.data(delink(json, this.delinkify))
          return resolve(null)
        }
        // We're not using onData, so collect all records.
        // These will be returned with the promise is resolved.
        return resolve(delink(json, this.delinkify))
      }.bind(this))
      .catch(function (err) {
        if (this._useOnError()) {
          this.callbacks.error(err)
          return resolve(null)
        }
        return reject(err)
      }.bind(this))
    }.bind(this))
  }
  /**
   * UNARCHIVE
   */
  this._unarchive = function ({ path, id, delink }) {
    return new Promise(function (resolve, reject) {
      const method = 'post'
      const url = CLINIKO_API_BASE + appendId(path, id) + '/unarchive'
      return this._doRequest({ method, url })
      .then(function (json) {
        if (this._useOnData()) {
          this.callbacks.data(delink(json, this.delinkify))
          return resolve(null)
        }
        // We're not using onData, so collect all records.
        // These will be returned with the promise is resolved.
        return resolve(delink(json, this.delinkify))
      }.bind(this))
      .catch(function (err) {
        if (this._useOnError()) {
          this.callbacks.error(err)
          return resolve(null)
        }
        return reject(err)
      }.bind(this))
    }.bind(this))
  }
  /**
   * CANCEL
   */
  this._cancel = function ({ path, id, delink }) {
    return new Promise(function (resolve, reject) {
      const method = 'patch'
      const url = CLINIKO_API_BASE + appendId(path, id) + '/cancel'
      return this._doRequest({ method, url })
      .then(function (json) {
        if (this._useOnData()) {
          this.callbacks.data(delink(json, this.delinkify))
          return resolve(null)
        }
        // We're not using onData, so collect all records.
        // These will be returned with the promise is resolved.
        return resolve(delink(json, this.delinkify))
      }.bind(this))
      .catch(function (err) {
        if (this._useOnError()) {
          this.callbacks.error(err)
          return resolve(null)
        }
        return reject(err)
      }.bind(this))
    }.bind(this))
  }
  this._useOnData = function () { return this._hasCallback('data') }
  this._useOnDone = function () { return this._hasCallback('done') }
  this._useOnError = function () { return this._hasCallback('error') }
  this._hasCallback = function (name) { return typeof this.callbacks[name] === 'function' }
  /**
   * When an event is emited
   * @param  {[type]}   name     [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  this.on = function (name, callback) {
    this.callbacks[name] = callback
  }
  this.summary = function () {
    return this.query_summary
  }
  // Add in all of the functions we need
  const fns = ENDPOINTS.reduce(function (obj, endpoint) {
    return Object.assign(obj, functionise(this, endpoint))
  }.bind(this), {})
  Object.assign(this, fns)
}
