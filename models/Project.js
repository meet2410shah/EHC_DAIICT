const mongoose = require(`mongoose`);
const Schema = mongoose.Schema;

// Create Schema and Model
const projectSchema = new Schema({
  title: String,
  content: String,
  creationDate: { type: Date, default: Date.now() },
  author: String,
  filepath: String,
  fileid: String,
  username: String
});

module.exports = mongoose.model(`Project`, projectSchema);
