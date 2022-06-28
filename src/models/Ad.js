const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const modelSchema = new mongoose.Schema({
        status: String,
        idUser: String,
        state: String,
        dateCreated: Date,
        title: String,
        category: String,
        price: Number,
        priceNegotiable: Boolean,
        description: String,
        views: Number,
        images: [Object]
});

const modelName = 'Ad';

if(mongoose.connection && mongoose.connection.models[modelName]){
    module.exports = mongoose.connection.models[modelName];
} else {
    module.exports = mongoose.model(modelName, modelSchema);
}