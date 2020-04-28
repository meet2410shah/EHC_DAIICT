const mongoose = require(`mongoose`);
const Schema = mongoose.Schema;

// Create Schema and Model
const memberSchema = new Schema({
  first_name: String,
  last_name: String,
  your_email: String,
  your_username: { type: String, unique: true },
  password: String,
});

module.exports = mongoose.model(`Member`, memberSchema);
