const mongoose = require(`mongoose`);
const Schema = mongoose.Schema;

// Create Schema and Model
const memberSchema = new Schema({
  name: String,
  email: String,
  mobile: Number,
  username: { type: String, unique: true },
  password: String
});

module.exports = mongoose.model(`Member`, memberSchema);
