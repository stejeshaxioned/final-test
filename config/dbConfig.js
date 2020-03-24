//Bring in the mongoose module
const mongoose = require('mongoose');

var dbURI = `mongodb://localhost:27017/${process.env.DB_NAME}`;

//console to check what is the dbURI refers to
console.log(`Database URL is => ${dbURI}`);

//Open the mongoose connection to the database
mongoose.connect(dbURI, {
  useUnifiedTopology: true,
  config: {
    autoIndex: false
  },
  useNewUrlParser: true,
  useFindAndModify:false
});

// Db Connection
var db = mongoose.connection;

db.on('connected', () => {
  console.log(`Mongoose connected to ${dbURI}`);
});

db.on('error', (err) => {
  console.log(`Mongoose connection error: ${err}`);
});

db.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

process.on('SIGINT', () => {
  db.close(function() {
    console.log('Mongoose disconnected through app termination');
    process.exit(0);
  });
});

//Exported the database connection to be imported at the server
exports.default = db;
