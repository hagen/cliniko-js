// NodeJS gets stropy with non-standard HEADER responses.
// Apparently this library can resolve it. However, you have
// to monkey patch the http_parser for it to work, so require it
// before request.
process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;
const request = require('request')
const retry = require('promise-retry')
const RETRY_OPTS = { retries : 2, factor : 2, randomize : true }
const CLINIKO_API_BASE = "https://api.cliniko.com/v1"

function NoAPIKeyError(message) {
  this.name = "NoAPIKeyError";
  this.message = message;
}
NoAPIKeyError.prototype = new Error();

function NoUserAgentError(message) {
  this.name = "NoUserAgentError";
  this.message = message;
}
NoUserAgentError.prototype = new Error();

/**
 * Get the Cliniko settings data
 * @param  {[type]} api_key    [description]
 * @return {[type]}            [description]
 */
function prepareUrl( target, query_string ) {
  return CLINIKO_API_BASE + target + ( query_string ? query_string : "")
}
/**
 * Queries Cliniko API with supplied parameters.
 * This function is called by a runner implementing jitter. *
 * @param  {[type]} url        [description]
 * @param  {[type]} body       [description]
 * @param  {[type]} method     [description]
 * @param  {[type]} api_key    [description]
 * @param  {[type]} user_agent [description]
 * @return {[type]}            [description]
 */
function safeQuery(url, body, method, api_key, user_agent) {
  return new Promise( ( resolve, reject ) => {
    const options = {
      method: method,
      url: url,
      auth: {
        username : api_key,
        password : "",
        sendImmediately : true
      },
      headers: {
        'User-Agent': user_agent,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      json: body || true
    }
    // Run the HTTP request
    request(options, (err, response, json) => {
      if (err) reject(err)
      else {
        // Resolve withe JSON response, or with an empty object
        resolve( !json || json === null ? {} : json)
      }
    })
  })
}
const query = ({ api_key, body, method, path, query_string, user_agent }) => {
  return new Promise((resolve, reject) => {
    // Must have an API key
    if (!api_key || api_key.length === 0) {
      return reject(new NoAPIKeySuppliedError(`No API key was supplied for the target ${target}, user agent ${user_agent}`))
    }
    // Build the URL and submit
    const url = prepareUrl(path, query_string)
    // Submit with Jitter
    retry(RETRY_OPTS, (retry, number) => {
      console.log(`[STATUS] Attempt ${number} running HTTPs ${method} to Cliniko (${user_agent}):`, url)
      return safeQuery(url, body, method, api_key, user_agent)
        .then(resolve)
        .catch(retry)
    }).catch(reject)
  })
}
function APIPublicSettings(cliniko) {
  const path = "/settings/public"
  return {
    get : function() {
      return cliniko.get({ path })
    }.bind(this)
  }
}
function APISettings(cliniko) {
  const path = "/settings"
  return {
    Public: function() {
      return APIPublicSettings(cliniko)
    }.bind(this),
    get: function() {
      return cliniko.get({ path })
    }.bind(this)
  }
}
function APIUser(cliniko) {
  const path = "/user"
  return {
    get: function() {
      return cliniko.get({ path })
    }.bind(this)
  }
}
function APIUsers(cliniko, id) {
  const path = "/users"
  return {
    get: function() {
      return cliniko.get({ path }, id)
    }.bind(this)
  }
}
function Cliniko({ api_key, user_agent }) {
  if(!api_key) throw new NoAPIKeyError()
  if(!user_agent) throw new NoUserAgentError()
  this.api_key = api_key
  this.user_agent = user_agent
  this.Settings = function() {
    return APISettings(this)
  }.bind(this)
  this.User = function() {
    return APIUser(this)
  }.bind(this)
  this.Users = function(id) {
    return APIUsers(this, id)
  }.bind(this)
}
Cliniko.prototype.get = function(entity, id) {
  return new Promise(function(resolve, reject) {
    const opts = {
      api_key: this.api_key,
      body: null,
      method: "get",
      path : entity.path + ( id ? `/${id}` : "" ),
      query_string: null,
      user_agent : this.user_agent,
    }
    query(opts, id)
      .then(resolve)
      .catch(reject)
  }.bind(this))
}
module.exports = Cliniko
