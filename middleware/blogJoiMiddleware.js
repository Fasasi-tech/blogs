const joi = require("joi");

const createBlogValidator = async (req, res, next) => {
    try{
        const payload = req.body;

        const schema = joi.object({
            title: joi.string().required(),
            decription: joi.string().required(),
            author:joi.string().required(),
            body:joi.string().required(),
            tags:joi.string().required(),
            read_count:joi.number().required(),
            reading_time:joi.string().required(),
            state:joi.string().valid('draft', 'published').required(),
            
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