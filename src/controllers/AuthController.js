const { validationResult, matcheData } = require('express-validator')

module.exports = {
    signin: async ( req, res ) => {

    },
    signup: async ( req, res ) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            res.json({error: errors.mapped()});
            return;
        }

        const data = matcheData(req);

        res.json({ tudocerto: true, data });
    }
}