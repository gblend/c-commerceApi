const fs = require("fs");
const CustomError = require("../errors");
const cloudinary = require('cloudinary').v2;

const uploadProductImage = async (req) => {
    if (!req.files) {
        throw new CustomError.BadRequestError('No file uploaded');
    }

    const productImage = req.files.productImage;
    if (!productImage.mimeType.startsWith('image/')) {
        throw new CustomError.BadRequestError('Please provide a valid product image');
    }

    const maxSize = 1024 * 1024;
    if (productImage.size > maxSize) {
        throw new CustomError.BadRequestError('File exceeds maximum size of 1mb');
    }

   const result = await cloudinary.uploader.upload(productImage.tempFilePath, {
        use_filename: true,
        folder: 'file-upload'
    })
    fs.unlinkSync(productImage.tempFilePath);
   return result;
}

module.exports = {uploadProductImage}
