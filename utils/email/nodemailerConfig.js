const nodemailer = require('nodemailer');
require('dotenv').config({path: '../.env'});

const transporterInit = () => {
    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
            user: process.env.MAIL_AUTH_USER,
            pass: process.env.MAIL_AUTH_PASSWORD
        }
    })
}

const sendEmail = ({to, subject, html}) => {
    const from = process.env.MAIL_ROM
    return transporterInit().sendMail({
        from,
        to,
        subject,
        html
    })
}

module.exports = {
    sendEmail
}
