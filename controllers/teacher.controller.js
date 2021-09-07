const logger = require("../loggingFunction");
const lineNumber = require('../lineNumberFunction');
const {teacherProfile, teacherExpirence} = require("../utils/detailData");

const teacherModel = require("../models/teacher.model");
const courseModel = require("../models/course.model");


var _ = require('lodash');
const {parallelValidator, parseDataResume, parsedLanguages, seqValidator} = require('../validator');
const {body, param} = require('express-validator');
const userModel = require("../models/user.model");


exports.teacherDetails= async (req, res) => {
        try {
            logger("info", req, "", lineNumber.__line)
            const errors = await parallelValidator(req, [
                body("firstName"),
                body("lastName"),
                body("gender"),
                body("dob"),
                body("countryCode"),
                body("contact"),
                body("teacherType"),
                // body("languageSpeak").custom((value) => parsedLanguages(value)),
                // body("languageTeaches").if(body("languageSpeak").exists()).notEmpty().custom((value) => parsedLanguages(value)),
                body("fromState"),
                body("fromCountry"),
                body("imageProfile"),
                body("imageProfileData"),
                body("currentState"),
                body("currentCountry"),
                body("selfIntro"),
                body("videoURL"),
                // body("resume").custom(parseDataResume),
                // body("certificateData").if(body("resume").exists()),
            ])
            if (!errors.isEmpty()) {
                logger("error", req, {
                    errors: errors.array()
                }, lineNumber.__line);
                return res
                    .status(400)
                    .send({
                        errors: errors.array()
                    });
            }   
            
            const teacherResume = await teacherExpirence(req.body.resume, req.files.certificateData)

            const teacherDetails = await teacherModel.findOne({teacherId: req.user.id})

            const personalDetail = await teacherProfile(req)

            var filter = _.pickBy(personalDetail, function (value, key) {
                return !(value === '' || value === undefined)
            });

            const update = {
            $set: filter,
              $addToSet: {
                teacherExp: teacherResume
              }
            }
            if (teacherDetails) {
                await teacherModel.findOneAndUpdate({
                    teacherId: req.user.id
                }, update)
                return res
                    .status(201)
                    .send("Updated")
            } else {
                const obj = new teacherModel({teacherId: req.user.id})
                const data = await obj.save()
                if (data) {
                    await teacherModel.findOneAndUpdate({
                        teacherId: req.user.id
                    }, update)
                    await userModel.findOneAndUpdate({_id: req.user.id}, {onType: data._id})
                    return res
                        .status(201)
                        .send("Updated")
                }
            }
    

        } catch (err) {
            logger("error", req, err, lineNumber.__line);
            console.log(err, lineNumber.__line);
            res
                .status(500)
                .send({
                    errors: [
                        {
                            code: 500,
                            message: "Internal Server Error",
                            error: err
                        }
                    ]
                });
        }
    },

exports.createCoupon = async (req, res) => {
    try {
        logger("info", req, "", lineNumber.__line)
        const errors = seqValidator(req, [
            body("courseId").exists().withMessage("Mandatory"),
            body("discountAmt").exists().withMessage("Mandatory"),
            body("validTill").exists().withMessage("Mandatory"),
            body("occasion").exists().withMessage("Mandatory")
        ])
        if(!errors.isEmpty()) {
            logger("error", req, {
                errors: errors.array()
            }, lineNumber.__line);
            return res
                .status(400)
                .send({
                    errors: errors.array()
                });
        }
        const {
            courseId,
            discountAmt,
            validTill,
            occasion
        } = req.body
        const coupon = new courseModel({
            generatedBy: req.user.id,
            courseId,
            discountAmt,
            validTill,
            occasion
        })
        const couponObject = await coupon.save()
        if(couponObject) {
            await teacherModel.findOneAndUpdate({_id: req.user.id}, {$addToSet: {coupons: couponObject._id}})
        }
        else {
            throw("Something went wrong")
        }
    }catch(err) {
     logger("error", req, err, lineNumber.__line);
            console.log(err, lineNumber.__line);
            res
                .status(500)
                .send({
                    errors: [
                        {
                            code: 500,
                            message: "Internal Server Error",
                            error: err
                        }
                    ]
                });
    }
}