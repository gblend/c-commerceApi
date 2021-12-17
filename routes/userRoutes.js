const express = require('express');
const { authenticateUser, authorizePermissions } = require('../middleware/authentication');

const router = express.Router();
const {
    getAllUsers,
    getAllAdmins,
    getSingleUser,
    updateUser,
    updateUserPassword,
    showCurrentUser
} = require('../controllers/userController');

router.route('/').get(authenticateUser, authorizePermissions('admin', 'owner'), getAllUsers);
router.route('/admins').get(authenticateUser, authorizePermissions('admin', 'owner'), getAllAdmins);
router.route('/me').get(showCurrentUser);
router.route('/updateUserPassword').patch(authenticateUser, updateUserPassword);
router.route('/:id').get(authenticateUser, getSingleUser).patch(authenticateUser, updateUser);

module.exports = router;
