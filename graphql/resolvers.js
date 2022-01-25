module.exports = {
    getProduct() {
        return {
            title: 'New product',
            created_at: Date.now(),
            updated_at: Date.now()
        }
    },
    createProduct() {
        return { msg: 'New product created' };
    }
}
