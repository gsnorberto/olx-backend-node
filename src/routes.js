const express = require('express');
const router = express.Router();

const AuthController = require('./controllers/AuthController');
const UserController = require('./controllers/UserController');
const AdsController = require('./controllers/AdsController');

const Auth = require('./middlewares/Auth');

const AuthValidator = require('./validators/AuthValidator')

router.get('/ping', (req, res) => {
    res.json({ pong: true });
})

router.get('/states', Auth.private, UserController.getStates);

router.post('/user/signin', AuthController.signin);
router.post('/user/signup', AuthValidator.signup, AuthController.signup);

router.get('/user/me', Auth.private, UserController.info); //private
router.put('/user/me', Auth.private, UserController.editAction); //private

router.get('/categories', AdsController.getCategories);

router.post('/ad/add', Auth.private, AdsController.addAction); //private
router.get('/ad/list', AdsController.getList);
router.get('/ad/item', AdsController.getItem);
router.post('/ad/:id', Auth.private, AdsController.editAction); //private

module.exports = router;