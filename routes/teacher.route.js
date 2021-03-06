const router = require("express").Router();
const {teacherDetails, createCoupon, getTeacherOnboard, getTeacher, languageUpdate} = require('../controllers/teacher.controller');
const {allowedRole} = require('../middlewares/roles.middleware')
const {upload} = require('../utils/uploadMulter')


const { auth } = require("../middlewares/authenticator.middleware");

router.post('/personaldetail', auth, allowedRole(["Teacher"]) , upload.fields([
  {
    name: 'imageProfileData',
    maxCount: 1
  }, {
    name: 'certificateData',
    maxCount: 10
  }
]), teacherDetails)

router.post('/createCoupon', auth, allowedRole(["Teacher"]), createCoupon)

router.get('/', auth, allowedRole(["Teacher"]), getTeacherOnboard)

router.get('/detail', auth, allowedRole(["Teacher"]), getTeacher)

router.patch('/', auth, allowedRole(["Teacher"]), languageUpdate)

module.exports = router;