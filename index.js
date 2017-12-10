// NodeJS gets stropy with non-standard HEADER responses.
// Apparently this library can resolve it. However, you have
// to monkey patch the http_parser for it to work, so require it
// before request.
process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser
const request = require('request')
const jitter = require('promise-retry')
const DEFAULT_RETRY_OPTS = {
  retries: 2,
  factor: 2,
  randomize: true
}
const CLINIKO_API_BASE = "https://api.cliniko.com/v1"
const OPERATORS = [
  { std: '<=', mod : ':<=' },
  { std: '>=', mod : ':>=' },
  { std: '~~', mod : ':~~' },
  { std: '!=', mod : ':!=' },
  { std: '<>', mod : ':!=' },
  { std: '<', mod : ':<' },
  { std: '>', mod : ':>' },
  { std: '=', mod : ':=' },
  { std: '~', mod : ':~' },
  { std: '', mod : '' }
]

function NoAPIKeyError(message) {
  this.name = "NoAPIKeyError"
  this.message = message
}
NoAPIKeyError.prototype = new Error()

function NoUserAgentError(message) {
  this.name = "NoUserAgentError"
  this.message = message
}
NoUserAgentError.prototype = new Error()

function TooManySearchParametersError(message) {
  this.name = "TooManySearchParametersError"
  this.message = message
}
TooManySearchParametersError.prototype = new Error()

/**
 * Get the Cliniko settings data
 * @param  {[type]} api_key    [description]
 * @return {[type]}            [description]
 */
const appendSearch = ( uri, search ) => {
  const qs = search.reduce((acc, entry) => {
    let query = OPERATORS.reduce((str, op) => {
      if (entry.includes(op.standard) && !entry.includes(op.modified)) {
        return entry.replace(op.standard, op.modified)
      }
      return str
    }, "")
    acc.push(query)
  }, []).join("&")
  return [uri, qs].join("")
}
/**
 * Create a path with the id
 */
const appendId = ( uri, id ) => {
  return [uri, "/", id].join("")
}
const Cliniko = exports.Cliniko = function({ api_key, user_agent, retries }) {
  this.retries = retries || DEFAULT_RETRY_OPTS.retries

  if(!api_key) throw new NoAPIKeyError()
  if(!user_agent) throw new NoUserAgentError()
  this.api_key = api_key.trim()
  this.user_agent = user_agent.trim()
  /**
   * Request
   */
  this._request = function({ method, uri, body }) {
    return new Promise(function( resolve, reject ) {
      const options = {
        method,
        url : CLINIKO_API_BASE + uri,
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
        if (err) reject(err)
        else {
          // Resolve withe JSON response, or with an empty object
          resolve( !json || json === null ? {} : json)
        }
      })
    }.bind(this))
  }
  /**
   * Request wrapper with Jitter retries
   */
  this._doRequest = function({ method, uri, body }) {
    return new Promise(function(resolve, reject) {
      // Submit with Jitter retry
      jitter(Object.assign({}, DEFAULT_RETRY_OPTS, {
        retires : this.retries
      }), function(retry, number) {
        return this._request({ method, uri, body })
        .catch(retry)
      }.bind(this))
      .then(resolve, reject)
    }.bind(this))
  }
  /**
   * GET
   */
  this._get = function({ path, id, search }) {
    const method = "get"
    // Can't have both ID and search
    if (id && search) {
      throw new TooManySearchParametersError(`When issuing a GET on ${path}, you can supply either the entity ID (id), or search parameters (query string).`)
    }
    let uri = path
    if (search) uri = appendSearch(uri += "?", search)
    else if (id) uri = appendId(uri, id) + "?"
    else uri += "?"
    return this._doRequest({ method, uri })
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
};

(function() {
  this.getSettings = function() {
    const path = "/settings"
    return this._get({ path })
  }
  this.getPublicSettings = function() {
    const path = "/settings/public"
    return this._get({ path })
  }
  this.getUser = function() {
    const path = "/user"
    return this._get({ path })
  }
  this.getUsers = function({id, search }) {
    const path = "/users"
    return this._get({ path, id, search })
  }
}).call(Cliniko.prototype)
