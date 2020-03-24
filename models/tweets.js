const { Schema, model } = require('mongoose');
const User = require('./users');

const tweetSchema = new Schema({
  body: String,
  user: { type: Schema.ObjectId, ref: 'User' },
  favoriters: [{ type: Schema.ObjectId, ref: 'User' }],
  favoritesCount: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tweetSchema.pre('save', async function(next) {
  this.favoritesCount = this.favoriters.length;
  let result = await User.findOneAndUpdate(
    { _id: this.user },
    { $inc: { tweets: 1 } }
  );
  if (!result) {
    next(err);
  } else {
    next();
  }
});

module.exports = model('Tweet', tweetSchema);
