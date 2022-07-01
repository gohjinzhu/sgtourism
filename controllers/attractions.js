const Attraction = require('../models/attraction');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

module.exports.index = async (req, res) => {
    const attractions = await Attraction.find({}).populate('popupText');
    res.render('attractions/index', { attractions })
}

module.exports.renderNewForm = (req, res) => {
    res.render('attractions/new');
}

module.exports.createattraction = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.attraction.location,
        limit: 1
    }).send()
    const attraction = new Attraction(req.body.attraction);
    attraction.geometry = geoData.body.features[0].geometry;
    attraction.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    attraction.author = req.user._id;
    await attraction.save();
    console.log(attraction);
    req.flash('success', 'Successfully made a new attraction!');
    res.redirect(`/attractions/${attraction._id}`)
}

module.exports.showAttraction = async (req, res,) => {
    const attraction = await Attraction.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!attraction) {
        req.flash('error', 'Cannot find that attraction!');
        return res.redirect('/attractions');
    }
    res.render('attractions/show', { attraction });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const attraction = await Attraction.findById(id)
    if (!attraction) {
        req.flash('error', 'Cannot find that attraction!');
        return res.redirect('/attractions');
    }
    res.render('attractions/edit', { attraction });
}

module.exports.updateAttraction = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const attraction = await Attraction.findByIdAndUpdate(id, { ...req.body.attraction });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    attraction.images.push(...imgs);
    await attraction.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await attraction.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated attraction!');
    res.redirect(`/attractions/${attraction._id}`)
}

module.exports.deleteAttraction = async (req, res) => {
    const { id } = req.params;
    await Attraction.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted attraction')
    res.redirect('/attractions');
}