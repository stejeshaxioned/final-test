const Joi = require('@hapi/joi');
const ObjectId = require('mongoose').Types.ObjectId;
const User = require('../models/users');
const Tweet = require('../models/tweets');

exports.createTweets = async (req, res) => {
  try {
    const { body } = req.body;
    const schema = Joi.object({
      body: Joi.string()
        .required()
        .min(4)
        .max(280)
        .error(new Error('Invalid Body Provided.'))
    });

    const result = schema.validate({ body });
    if (result.error) {
      return res
        .status(400)
        .send({ error: result.error.message, success: false, data: null });
    }

    let tweet = new Tweet({
      body,
      user: req.userId
    });
    await tweet.save();
    res.send({ error: null, success: true, data: { message: 'Tweet Added.' } });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.updateTweet = async (req, res) => {
  try {
    const { createdAt } = req.params;
    const { body } = req.body;
    const schema = Joi.object({
      body: Joi.string()
        .min(4)
        .max(280)
        .required()
        .error(new Error('Invalid Body Provided.'))
    });
    const result = schema.validate({ body });
    if (result.error) {
      return res
        .status(400)
        .send({ error: result.error.message, success: false, data: null });
    }
    let doc = await Tweet.findOneAndUpdate(
      { user: req.userId, createdAt },
      { $set: { body, updatedAt: Date.now } }
    );
    if (!doc) {
      return res
        .status(404)
        .send({ error: 'Tweet Not Found.', success: false, data: null });
    }
    res.send({
      error: null,
      success: true,
      data: { message: 'Tweet Updated.' }
    });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.deleteTweet = async (req, res) => {
  try {
    const { createdAt } = req.params;
    let result = await Promise.all([
      Tweet.findOneAndDelete({ user: req.userId, createdAt }),
      User.findOneAndUpdate({ _id: req.userId }, { $inc: { tweets: -1 } })
    ]);
    if (!result) {
      return res.status(400).send({
        error: 'Something went wrong. Please Try Again.',
        success: false,
        data: null
      });
    }
    res.send({
      error: null,
      success: true,
      data: { message: 'Tweet Deleted.' }
    });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.getUserTweets = async (req, res) => {
  try {
    const limit = 10;
    let { sort = '_id', pageNo } = req.query;
    if (pageNo <= 0) {
      pageNo = 1;
    }
    pageNo--;
    let tweets = await Tweet.find({ user: req.userId }, '-__v -user -_id')
      .sort(`${sort}`)
      .skip(pageNo * limit)
      .limit(limit);
    if (!tweets) {
      return res
        .status(404)
        .send({ error: 'No Tweets Found.', success: true, data: null });
    }
    res.send({ error: null, success: true, data: tweets });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.getFollowingTweets = async (req, res) => {
  try {
    const limit = 10;
    let { pageNo } = req.query;
    if (pageNo <= 0) {
      pageNo = 1;
    }
    pageNo--;
    const tweets = await User.aggregate([
      {
        $match: {
          _id: ObjectId(req.userId)
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: 'following',
          foreignField: 'user',
          as: 'tweets'
        }
      },
      {
        $unwind: '$tweets'
      },
      {
        $sort: {
          'tweets.createdAt': -1
        }
      },
      {
        $skip: pageNo * limit
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          favoriters: '$tweets.favoriters',
          body: '$tweets.body',
          user: '$tweets.user',
          createdAt: '$tweets.createdAt',
          updatedAt: '$tweets.updatedAt',
          favoritesCount: '$tweets.favoritesCount'
        }
      }
    ]);
    if (!tweets) {
      return res
        .status(404)
        .send({ error: 'No Tweets found.', success: true, data: null });
    }
    res.send({ error: null, success: true, data: tweets });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.likeDislikeTweet = async (req, res) => {
  try {
    const { createdAt, byUser } = req.params;
    const isLiked = await Tweet.find({
      user: byUser,
      createdAt,
      favoriters: req.userId
    }).countDocuments();

    if (!isLiked) {
      const result = await Tweet.findOneAndUpdate(
        { user: byUser, createdAt },
        {
          $addToSet: { favoriters: req.userId },
          $inc: { favoritesCount: 1 }
        }
      );
      res.send(result);
    } else {
      const result = await Tweet.findOneAndUpdate(
        { user: byUser, createdAt },
        {
          $pull: { favoriters: { $in: [req.userId] } },
          $inc: { favoritesCount: -1 }
        }
      );
      res.send(result);
    }
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};
