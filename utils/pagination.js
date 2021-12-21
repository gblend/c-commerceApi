const paginator = async (req, resultData) => {
    const pagination = {}

    if (!req.params) {
        pagination.pageSize = 10;
        pagination.pageNumber = 1;
    }

    pagination.offset = Number((pagination.pageNumber - 1) * pagination.pageSize);
    const result = await resultData.skip(pagination.offset).limit(pagination.pageSize);
    console.log(pagination, resultData);
    return {pagination, result}
}


module.exports = {
    paginator
}
