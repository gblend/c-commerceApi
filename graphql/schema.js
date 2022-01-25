const {buildSchema} = require('graphql');


module.exports = buildSchema(`
    type CreateProduct {
        msg: String!
    }
    
    type RootQuery {
        createProduct: CreateProduct!,
    }
    
    schema {
        query: RootQuery
    }
`)
