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
      var url = obj.links.self
      var id = url.match(/\d+$/g)[0]
      return parseInt(id, 10)
    }

    let delinked = this.fields.reduce(function(rec, field) {
      if (rec.hasOwnProperty(field.name)) {
        const id = extractLinkId(rec[field.name])
        delete rec[field.name]
        rec[field.rename] = id
      }
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
