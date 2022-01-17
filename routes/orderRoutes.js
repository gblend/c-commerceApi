const express = require('express');
const router = express.Router();

const {
    getSingleOrder,
    getAllOrders,
    getCurrentUserOrders,
    createOrder,
    updateOrder
} = require('../controllers/orderController');
const {authenticateUser, authorizePermissions} = require("../middleware/authentication");
const {stripeWebhookHandler} = require("../controllers/stripeController");

router.route('/').get(authenticateUser, authorizePermissions('admin'), getAllOrders).post(authenticateUser, createOrder);
router.route('/userOrders').get(authenticateUser, getCurrentUserOrders);
router.route('/:id').get(authenticateUser, getSingleOrder).patch(authenticateUser, updateOrder);
router.route('/webhook').post(stripeWebhookHandler);

module.exports = router;
