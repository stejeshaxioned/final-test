const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/users');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const schema = Joi.object({
      name: Joi.string()
        .required()
        .error(new Error('Invalid Name Provided.')),
      email: Joi.string()
        .email()
        .required()
        .error(new Error('Invalid Email Id Provided.')),
      password: Joi.string()
        .pattern(
          new RegExp(
            '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'
          )
        )
        .required()
        .error(
          new Error(
            'Invalid Password Provided. Password Must Be 8 or More Characters Long & Must Contains Atleast One Alphabet (Capital and Small) & Number & Special character.'
          )
        )
    });

    const result = schema.validate({
      name,
      email,
      password
    });
    if (result.error) {
      return res
        .status(400)
        .send({ error: result.error.message, success: false, data: null });
    }

    const isExist = await User.exists({ email });
    if (!isExist) {
      let user = new User({
        name,
        email,
        password
      });
      user.save();
      res.send({
        error: null,
        success: true,
        data: { message: 'User Registered.' }
      });
    } else {
      return res.status(400).send({
        error: 'Email Id already exists. Please Login.',
        success: false,
        data: null
      });
    }
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .required()
        .error(new Error('Invalid Email Id Provided.')),
      password: Joi.string()
        .pattern(
          new RegExp(
            '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'
          )
        )
        .required()
        .error(
          new Error(
            'Invalid Password Provided. Password Must Be 8 or More Characters Long & Must Contains Atleast One Alphabet (Capital and Small) & Number & Special character.'
          )
        )
    });
    const result = schema.validate({
      email,
      password
    });

    if (result.error) {
      return res.status(400).send({
        error: `Invalid Data Provided : ${result.error.message}`,
        success: false,
        data: null
      });
    }

    const user = await User.findOne({ email });
    //if user does not exist
    if (!user) {
      return res.status(400).send({
        error: 'Email Id or Password is wrong.',
        success: false,
        data: null
      });
    }

    //if user exists and does not matches the password
    let isMatching = await bcrypt.compare(password, user.password);
    if (!isMatching) {
      return res.status(400).send({
        error: 'Email Id or Password is wrong.',
        success: false,
        data: null
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.header('auth-token', token);
    res.send({
      error: null,
      success: true,
      data: { message: 'User Logged In', token }
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.userId }, '-_id -__v -password');
    if (!user) {
      return res
        .status(400)
        .send({ error: 'No User Found.', success: true, data: null });
    } else {
      res.send({ error: null, success: true, data: user });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.updateUser = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.userId });
    let { name, email, password } = req.body;
    let schema = Joi.object({
      name: Joi.string()
        .min(2)
        .error(new Error('Invalid name')),
      email: Joi.string()
        .allow('')
        .error(new Error('Invalid email')),
      password: Joi.string()
        .pattern(
          new RegExp(
            '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'
          )
        )
        .allow('')
        .error(
          new Error(
            'Invalid Password Provided. Password Must Be 8 or More Characters Long & Must Contains Atleast One Alphabet (Capital and Small) & Number & Special character.'
          )
        )
    });

    let result = schema.validate({
      name,
      email,
      password
    });

    if (result.error) {
      return res
        .status(400)
        .send({ error: result.error.message, success: false, data: null });
    }
    //for password hook to execute using find & then updating that instance not findOneAndUpdate Or update.(mongoose update issues/964)
    userData.name = name || userData.name;
    userData.email = email || userData.email;
    userData.password = password || userData.password;
    let doc = await userData.save();
    if (!doc) {
      res
        .status(404)
        .send({ error: 'Data does not Exists.', success: false, data: null });
    } else
      res.send({
        error: null,
        success: true,
        data: { message: 'User Data Updated.' }
      });
  } catch (err) {
    console.log(err.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    let result = await User.deleteOne({ _id: req.userId });
    if (!result.deletedCount)
      res
        .status(404)
        .send({ error: 'Data does not Exists.', success: false, data: null });
    else
      res.send({
        error: null,
        success: false,
        data: { message: 'User deleted.' }
      });
  } catch (err) {
    console.log(err.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};

exports.followUser = async (req, res) => {
  try {
    const email = req.params.email;
    const followingUser = await User.findOne({ email });
    if (!followingUser) {
      return res.status(404).send({
        error: 'No Such User to Follow.',
        success: true,
        data: null
      });
    }
    
    let result= await Promise.all([
      User.findOneAndUpdate(
        { _id: req.userId },
        { $addToSet: { following: followingUser._id } }
      ).populate('following'),
      User.findOneAndUpdate(
        { _id: followingUser._id },
        { $addToSet: { followers: req.userId } }
      ).populate('followers')
    ]);

    if(!result) {
      return res.status(400).send({
        error: 'Something went wrong. Please Try Again.',
        success: false,
        data: null
      });
    }

    res.send({
      error: null,
      success: true,
      data: { message: `You Started following ${followingUser.name}` }
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .send({ error: 'Internal Server Error', success: false, data: null });
  }
};
