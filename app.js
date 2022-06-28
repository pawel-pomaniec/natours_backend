const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

const AppError = require('./utilities/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
//nice trick with join to prevent issue with directory of views file
app.set('views', path.join(__dirname, 'views'));

// Global Middleware
//Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//Set security http headers
// app.use(helmet({ crossOriginResourcePolicy: false }));
// app.use(
//   helmet({
//     crossOriginResourcePolicy: false,
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'", 'http://127.0.0.1:3000/*'],
//         baseUri: ["'self'"],
//         fontSrc: ["'self'", 'https:', 'data:'],
//         scriptSrc: [
//           "'self'",
//           'https://*.stripe.com',
//           'https://cdnjs.cloudflare.com/ajax/libs/axios/0.23.0/axios.min.js',
//         ],
//         frameSrc: ["'self'", 'https://*.stripe.com'],
//         objectSrc: ["'none'"],
//         styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
//         upgradeInsecureRequests: [],
//       },
//     },
//   })
// );

//development login
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//setup limiter of reqest per IP per hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
});
app.use('/api', limiter);

//body parser, reading data from body into req.body + limit to prevent large request
app.use(
  express.json({
    limit: '10kb',
  })
);

//Data sanitization against NoSQL query inejction
app.use(mongoSanitize());

//Data sanization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whiteList: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use(cors());

////Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//Handling not existing routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//Handling errors -> previous function provides err which we pass in next()
app.use(globalErrorHandler);

//Start server
module.exports = app;
