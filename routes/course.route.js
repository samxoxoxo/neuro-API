const router = require("express").Router();
const {createCourse, updateCourse, getAllCourse, deleteCourse, addReview} = require('../controllers/course.controller');
const {allowedRole, owner, userExistence} = require("../middlewares/roles.middleware");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");

const {auth} = require("../middlewares/authenticator.middleware");
const multer = require('multer');

const s3 = new aws.S3({secretAccessKey: `${process.env.S3_SECRET}`, accessKeyId: `${process.env.S3_ACESS_KEY}`, region: "ap-south-1"});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const upload = multer({
    fileFilter,
    storage: multerS3({
        acl: "public-read",
        s3: s3,
        bucket: "profileimagedata",
        metadata: function (req, file, cb) {
            cb(null, {fieldName: "TESTING_METADATA"});
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + file.originalname);
        }
    })
});

router.post('/createCourse', auth, allowedRole(["Teacher"]), userExistence, upload.single('courseImage', 1), createCourse);

router.put('/:id', auth, allowedRole(["Teacher", "Admin"]), owner, upload.single('courseImage', 1), updateCourse)

router.delete('/rest/:id', auth, allowedRole(["Teacher", "Admin"]), owner, deleteCourse)

router.get('/', getAllCourse)


module.exports = router;