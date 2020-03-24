const app = require('express').Router();
const auth = require('../controllers/authUser');
const userController = require('../controllers/user');
const tweetController = require('../controllers/tweet');

//Demo Api
app.get('/', (req, res) =>
  res.send({ error: null, success: true, data: 'Welcome To Twitter API' })
);

//All User Api's
app.post('/register', userController.register);
app.post('/login', userController.login);
app.get('/user', auth.authUser, userController.getUser);
app.patch('/user', auth.authUser, userController.updateUser);
app.patch('/user/:email', auth.authUser, userController.followUser);
app.delete('/user', auth.authUser, userController.deleteUser);
app.post('/user/tweet', auth.authUser, tweetController.createTweets);
app.get('/user/tweets', auth.authUser, tweetController.getUserTweets);
app.patch('/user/tweet/:createdAt', auth.authUser, tweetController.updateTweet);
app.delete(
  '/user/tweet/:createdAt',
  auth.authUser,
  tweetController.deleteTweet
);
app.get('/tweets', auth.authUser, tweetController.getFollowingTweets);
app.get('/tweets/:createdAt/:byUser', auth.authUser, tweetController.likeDislikeTweet);

module.exports = app;
