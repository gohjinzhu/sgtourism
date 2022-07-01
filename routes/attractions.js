const express = require('express');
const router = express.Router();
const attractions = require('../controllers/attractions');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateAttraction } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.route('/')
    .get(catchAsync(attractions.index))
    .post(isLoggedIn, upload.array('image'), validateAttraction, catchAsync(attractions.createattraction))


router.get('/new', isLoggedIn, attractions.renderNewForm)

router.route('/:id')
    .get(catchAsync(attractions.showAttraction))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateAttraction, catchAsync(attractions.updateAttraction))
    .delete(isLoggedIn, isAuthor, catchAsync(attractions.deleteAttraction));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(attractions.renderEditForm))



module.exports = router;