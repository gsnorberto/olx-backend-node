const Category = require('../models/Category');
const User = require('../models/User');
const Ad = require('../models/Ad');
const { v4: uuid } = require('uuid');
const jimp = require('jimp');

const addImage = async (buffer) => {
    let newName = `${uuid()}.png`;
    let tmpImg = await jimp.read(buffer); //read to image
    tmpImg.cover(500, 500).quality(80).write(`./public/media/${newName}`); //resize and save image
    return newName;
}

module.exports = {
    getCategories: async (req, res) => {
        const cats = await Category.find();

        let categories = [];

        for (let i in cats) {
            categories.push({
                ...cats[i]._doc,
                img: `${process.env.BASE}/assets/images/${cats[1].slug}.png`
            })

        }
        console.log(categories[1].slug);
        res.json({ categories });
    },

    addAction: async (req, res) => {
        let { title, price, priceneg, desc, cat, token } = req.body;
        const user = await User.findOne({ token }).exec();

        if (!title || !cat) {
            res.json({ error: 'Título e/ou categoria não foram preenchidos' });
            return;
        }

        if (price) {
            price = price.replace('.', '').replace(',', '.').replace('R$ ', ''); //converting national to international currency
            price = parseFloat(price)
        } else {
            price = 0;
        }

        const newAd = new Ad();
        newAd.status = true;
        newAd.idUser = user._id;
        newAd.state = user.state;
        newAd.dateCreated = new Date();
        newAd.title = title;
        newAd.category = cat;
        newAd.price = price;
        newAd.priceNegotiable = (priceneg === 'true') ? true : false;
        newAd.description = desc;
        newAd.views = 0;

        if (req.files && req.files.img) {
            if (req.files.img.length == undefined) { //Only image
                if (['image/jpg', 'image/jpeg', 'image/png'].includes(req.files.img.mimetype)) {
                    let url = await addImage(req.files.img.data);
                    newAd.images.push({
                        url,
                        default: false
                    })
                }
            } else { //two or more images
                for (let i = 0; i < req.files.img.length; i++) {
                    if (['image/jpg', 'image/jpeg', 'image/png'].includes(req.files.img[i].mimetype)) {
                        let url = await addImage(req.files.img[i].data);
                        newAd.images.push({
                            url,
                            default: false
                        })
                    }
                }
            }
        }

        if (newAd.images.length > 0) {
            newAd.images[0].default = true // set default image
        }

        const info = await newAd.save();
        res.json({ id: info._id });
    },

    getList: async (req, res) => {

    },

    getItem: async (req, res) => {

    },

    editAction: async (req, res) => {

    }
}