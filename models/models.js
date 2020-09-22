var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
    name: String,
    images: [Schema.Types.Mixed],
    comments: [Schema.Types.Mixed]
});

var productModel = mongoose.model('product', productSchema, 'products');

module.exports = { productModel };