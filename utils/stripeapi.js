const fakeStripeApi = async ({amount, currency}) => {
    const clientSecret = 'randomClientSecret';
    return {clientSecret, amount}
}


module.exports = fakeStripeApi;
