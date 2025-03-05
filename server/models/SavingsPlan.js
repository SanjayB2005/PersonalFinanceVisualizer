// In server/models/SavingsPlan.js
const mongoose = require('mongoose');

const savingsPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'Other'
  },
  icon: {
    type: String,
    default: 'ti ti-piggy-bank'
  },
  iconBg: {
    type: String,
    default: 'bg-indigo-500'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add this line to export the model
module.exports = mongoose.model('SavingsPlan', savingsPlanSchema);