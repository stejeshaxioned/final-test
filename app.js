const app = require('express')();
const bodyParser = require('body-parser');
require('dotenv').config();
const routes = require('./routes/routes');

//body parser configurations
app.use(
  bodyParser.json({
    limit: '50mb'
  })
);

app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true
  })
);

//setting routes
app.use('/api', routes);
app.use('/', (req, res) =>
  res
    .status(404)
    .send({ error: 'Resource not found.', success: false, data: null })
);

//db config
require('./config/dbConfig');

//server config
app.listen(process.env.PORT, () =>
  console.log(`Server is running on port ${process.env.PORT}`)
);
