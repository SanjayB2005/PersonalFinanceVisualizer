const mongoose = require('mongoose');

const spendingLimitSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  limit: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SpendingLimit', spendingLimitSchema);