const joi = require("joi");

const createAuthValidator = async (req, res, next) => {
    try{
        const payload = req.body;

        const schema = joi.object({
            first_name: joi.string().required(),
            last_name: joi.string().required(),
            email:joi.string().required(),
            password:joi.string().min(6).required(),
            role:joi.string().valid('user', 'admin').required(),
              active: joi.boolean().default(true)
        })

        const {error, value} = await schema.validate(payload);

        if (!error){
            next()
        } else{
             return res.status(400).json({
            status: "error",
            message: "Invalid payload",
            error: error.details
        })
        }
    } catch (error){
        return res.status(400).json({
            status:"error",
            message: error.message
        })
    }
}

module.exports ={
    createAuthValidator
}