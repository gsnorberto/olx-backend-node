const Category = require('../models/Category');
const User = require('../models/User');
const Ad = require('../models/Ad');
const StateModel = require('../models/State');
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
        let { sort = 'asc', offset = 0, limit = 8, q, cat, state} = req.query;
        let filters = { status: true };
        let total = 0;

        if(q){
            filters.title = {'$regex': q, '$options': 'i'} // case insensitive
        }

        if(cat){
            const c = await Category.findOne({ slug: cat }).exec();

            if(c){
                filters.category = c._id.toString();
            }
        }

        if(state){
            const s = await StateModel.findOne({ name: state.toUpperCase()});

            if(s){
                filters.state = s._id.toString();
            }
        }

        adsTotal = await Ad.find({ filters }).exec();
        total = adsTotal.length;

        const adsData = await Ad.find(filters)
            .sort({ dateCreated: (sort == 'desc' ? -1 : 1)})
            .skip(parseInt(offset))
            .limit(parseInt(limit))
        .exec();

        let ads = [];
        for (let i in adsData) {
            let image;

            let defaultImg = adsData[i].images.find(e => e.default);
            if(defaultImg) { // if existe default image
                image = `${process.env.BASE}/media/${defaultImg.url}`;
            } else {
                image = `${process.env.BASE}/media/default.jpg`;
            }

            ads.push({
                id: adsData[i]._id,
                title: adsData[i].title,
                price: adsData[i].price,
                priceNegotiable: adsData[i].priceNegotiable,
                image //default image
            })
        }

        res.json({ ads, total });
    },

    getItem: async (req, res) => {
        let { id, other = null } = req.query; // other = similar products information

        // product id not filled
        if(!id){
            res.json({ error: 'Sem produto' })
            return;
        }
        
        if(id.length < 12) {
            res.json({ error: 'ID Inválido' });
            return;
        }
        const ad = await Ad.findById(id);
        // product not found
        if(!id){
            res.json({ error: 'Produto inexistente' })
            return;
        }
        
        ad.views++; // number of views
        await ad.save();

        let images = [];
        for(let i in ad.images){
            images.push(`${process.env.BASE}/media/${ad.images[i].url}`);
        }

        let category = await Category.findById(ad.category).exec();
        let userInfo = await User.findById(ad.idUser).exec();
        let stateInfo = await StateModel.findById(ad.state).exec();

        let others = [];
        if(other){
            //other ads by the same user
            const otherData = await Ad.find({ status: true, idUser: ad.idUser }).exec();

            for(let i in otherData){
                // other ads by the same user != current ad
                if(otherData[i]._id.toString() != ad._id.toString()){
                    let image = `${process.env.BASE}/media/default.jpg`

                    let defaultImg = otherData[i].images.find(e => e.default);
                    if(defaultImg){
                        image = `${process.env.BASE}/media/${defaultImg.url}`
                    }

                    others.push({
                        id: other[i]._id,
                        title: otherData[i].title,
                        price: otherData[i].price,
                        priceNegotiable: otherData[i].priceNegotiable,
                        image
                    })
                }
            }
        }

        res.json({
            id: ad._id,
            title: ad.title,
            price: ad.price,
            priceNegotiable: ad.priceNegotiable,
            description: ad.description,
            dateCreated: ad.dateCreated,
            views: ad.views,
            images,
            category,
            userInfo: {
                name: userInfo.name,
                email: userInfo.email,
            },
            stateName: stateInfo.name,
            others
        })
    },

    editAction: async (req, res) => {

    }
}