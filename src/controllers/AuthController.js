const mongoose = require('mongoose');
const { validationResult, matchedData } = require('express-validator');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const State = require('../models/State');

module.exports = {
    // Login
    signin: async ( req, res ) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()});
            return;
        }
        const data = matchedData(req);

        // checking the e-mail
        const user = await User.findOne({ email: data.email });
        if(!user){
            res.json({ error: 'E-mail e/ou senha errados!' });
            return;
        }

        // checking the password
        const match = await bcrypt.compare(data.password, user.passwordHash);
        if(!match){
            res.json({ error: 'E-mail e/ou senha errados!' });
            return;
        }
        
        // create token
        const payload = (Date.now() + Math.random()).toString(); //random number
        const token = await bcrypt.hash(payload, 10);

        user.token = token;
        await user.save();

        res.json({ token, email: data.email });
    },

    // Create account
    signup: async ( req, res ) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()});
            return;
        }
        const data = matchedData(req);

        // checking the e-mail
        const user = await User.findOne({ email: data.email });
        if(user){
            res.json({
                error: { email: 'E-mail já existe!'}
            });
            return;
        }

        // checking the State
        if(mongoose.Types.ObjectId.isValid(data.state)){
            const stateItem = await State.findById(data.state);

            if(!stateItem){
                res.json({
                    error: {state: {msg: 'Estado não existe'}}
                })
                return;
            }
        } else {
            res.json({
                error: {state: {msg: 'Código de estado inválido!'}}
            })
            return;
        }

        // encrypting the password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // create token
        const payload = (Date.now() + Math.random()).toString(); //random number
        const token = await bcrypt.hash(payload, 10);

        // create user
        const newUser = new User({
            name: data.name,
            email: data.email,
            passwordHash,
            token,
            state: data.state
        });
        await newUser.save();

        res.json({ token });
    }
}