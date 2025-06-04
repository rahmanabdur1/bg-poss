// models/Media.js
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  image: String,
  deleteUrl: String,
  uploadedBy: String,
  uploadedAt: Date,
  title: String,
  caption: String,
  description: String,
  altText: String,
  fileName: String,
  fileSize: String,
  fileType: String,
  width: Number,
  height: Number,

  authorized: { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Pending' },
  authorizedBy: String,
  authorizedDate: Date,
  updatedBy: String,
  updatedAt: Date,
});

module.exports = mongoose.model('Media', mediaSchema);
