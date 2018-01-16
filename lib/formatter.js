const isArray = require('lodash').isArray

class Formatter {
  constructor (fields) {
    this.fields = fields
  }
  /**
   * Because we know that link URLs are a certain format, this manages
   * to extract the link entity ID from the URL, and stores it.
   */

  delink (record) {
    const extractLinkId = obj => {
      try {
        const url = obj.links.self
        const sid = url.match(/\d+$/g)[0]
        return parseInt(sid, 10)
      } catch (e) {
        // Usually because of a bad attempt at regex
        return null
      }
    }

    let delinked = this.fields.reduce(function (rec, field) {
      let val = null

      // If this field has its own delinker, use that
      if (field.delinker) {
        val = field.delinker(rec[field.name])
        delete rec[field.name]
      } else if (rec.hasOwnProperty(field.name) && isArray(rec[field.name])) {
        // IN some cases, the 'link' property of a record is an array
        // of other links. If it is an array, we need to map each object
        // to our extractLinkId function. This results in an array of Ids
        val = rec[field.name].map(obj => extractLinkId(obj))
        delete rec[field.name]
      } else if (rec.hasOwnProperty(field.name)) {
        // If it's just an object, then extract the link id
        val = extractLinkId(rec[field.name])
        delete rec[field.name]
      }
      rec[field.rename] = val
      return rec
    }, record)

    // Stage 1 - remove link properties
    return Object.keys(delinked).reduce((rec, key) => {
      if (typeof rec[key] === 'object' && rec[key] !== null) {
        if (rec[key].hasOwnProperty('links') || rec[key].hasOwnProperty('self')) {
          delete rec[key]
        }
      }
      return rec
    }, delinked)
  }
}

exports.Formatter = Formatter
