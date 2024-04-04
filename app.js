let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
const cors = require('cors');

const db = require('./connection');
db.connect();


let app = express();
// allow specified orgins only to access apis
app.use(cors({
  origin: '*'
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * @description on boarding
 */
const onBoardingR = require('./app/v1/onBoarding/router');
app.use('/v1/ob/', onBoardingR);

/**
 * @description Verify Token of authentication
 */
const { verifyToken } = require('./middleware/verifyJWT');
app.use(verifyToken);

/**
 * @description Appointment routes
 */
const appointmentR = require('./app/v1/appointment/router');
app.use('/v1/appointment/', appointmentR);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send({ message: err.message });
});

module.exports = app;
