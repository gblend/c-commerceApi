const express = require('express');
const router = express.Router();
const { authenticateUser, authorizePermissions } = require('../middleware/authentication');

const {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage
} = require('../controllers/productController');


router.route('/').get(getAllProducts);
router.route('/uploadImage').post(authenticateUser, authorizePermissions('admin'), uploadImage);
router.route('/:id')
    .get(getSingleProduct)
    .patch(authenticateUser, authorizePermissions('admin'), updateProduct)
    .delete(authenticateUser, authorizePermissions('admin'), deleteProduct);
router.route('/').post(authenticateUser, authorizePermissions('admin'), createProduct);

module.exports = router;
