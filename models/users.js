const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  tweets: { type: Number, default: 0 }
});

//encrytp data
userSchema.pre('save', async function(next) {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = model('User', userSchema);
