const isArray = require('lodash').isArray

class Formatter {
  constructor(fields) {
    this.fields = fields
  }
  /**
   * Because we know that link URLs are a certain format, this manages
   * to extract the link entity ID from the URL, and stores it.
   */

  delink(record) {
    const extractLinkId = obj => {
      try {
        const url = obj.links.self
        const sid = url.match(/\d+$/g)[0]
        return parseInt(sid, 10)
      } catch(e) {
        // Usually because of a bad attempt at regex
        return null
      }
    }

    debugger
    let delinked = this.fields.reduce(function(rec, field) {
      debugger
      let id = null
      if (rec.hasOwnProperty(field.name) && isArray(rec[field.name])) {
        id = rec[field.name].map(obj => extractLinkId(obj))
        delete rec[field.name]
      } else if (rec.hasOwnProperty(field.name)) {
        id = extractLinkId(rec[field.name])
        delete rec[field.name]
      }
      rec[field.rename] = id
      return rec
    }, record)

    // Stage 1 - remove link properties
    return Object.keys(delinked).reduce((rec, key) => {
      if (typeof rec[key] === "object" && rec[key] !== null) {
        if (rec[key].hasOwnProperty("links") || rec[key].hasOwnProperty("self")) {
          delete rec[key]
        }
      }
      return rec
    }, delinked)
  }
}

exports.Formatter = Formatter
