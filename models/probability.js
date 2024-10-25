const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  area: { type: String, required: true },
  suggestion: { type: String, required: true },
});
const skillsSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  level: { type: String, required: true },
});

const probabilitySchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  Probability3Months: { type: String },
  Probability6Months: { type: String },
  Probability9Months: { type: String },
  Probability9PlusMonths: { type: String },
  Suggestions: [suggestionSchema],
  Skills: [skillsSchema]
});

const Probability = mongoose.model('Probability', probabilitySchema);

module.exports = Probability;
