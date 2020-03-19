const {Transform, Writable} = require('stream')
class SaveStreamToDtb extends Transform {
  constructor(options) {
    super(options)
  }
  async _transform (line ,encoding, callback) {
    const trimmed = line.toString().trim()
    const scores = JSON.parse(trimmed)
    for (let score of scores) {
      let lib = await prom(score)
      console.log(lib)
    }
    callback(null, JSON.stringify(scores[0].lib_cpt))
  }
}

module.exports = {
  SaveStreamToDtb
}
