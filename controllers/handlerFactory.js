const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const APIFeatures = require('./../utilities/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    //commented out below cause there was not a possibility to a delete secret tour - this can help BUT no error
    //while deleting user which no longer exists (by Admin)
    // const doc = await Model.deleteOne({ _id: req.params.id });

    if (!doc) {
      return next(new AppError('No document found for that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

//previously deleteTour handler - now above there is one generic controller but for all models/documments
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.deleteOne({ _id: req.params.id });
//   //comment out below coz it was not a possibility to a delete secret tour
//   //const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found for that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //when we use findByIdAndUpdate all save middleware is not run
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      //by run validators if we updating a record then schema validatos will be run once again
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found for that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found for that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

//keeping old one for the reference
// exports.getTour = catchAsync(async (req, res, next) => {
//   //by adding populate we can show detailed objects of guides instead of ids only//
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // .populate({
//   //   //Tour.findOne({_id:req.params.id})
//   //   path: 'guides',
//   //   select: '-__v -passwordChangedAt',
//   // });

//   if (!tour) {
//     return next(new AppError('No tour found for that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //to allow for nested GET reviews on Tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    // by adding .explain() we can query for technical info from mongo

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
