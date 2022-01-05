const Redis = require('ioredis');

let redis = '';
const redisPort = process.env.REDIS_PORT || 6379;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisDb = process.env.REDIS_DB || 0;
const redisFamily = process.env.REDIS_FAMILY || 4;

const initRedisCache = async () => {
    if (!redis) {
        redis = new Redis({
            port: redisPort,
            host: redisHost,
            family: redisFamily,
            db: redisDb,
        });
    }
    return redis;
}

/**
 *
 * @param {string} key the key to set its corresponding value
 * @param {*} value the value to set for the specified key
 * @returns {Promise<void>}
 */
const redisSet = async (key, value) => {
    redis = await initRedisCache();
    redis.set(key, JSON.stringify(value));
}

/**
 * Retrieves the value of specified key
 * @param {string} key the key to retrieve its value
 * @returns {Promise<*>}
 */
const redisGet = async (key) => {
    redis = await initRedisCache();
    return redis.get(key, (err, result) => {
        if (err) {
            console.log(err);
        }
        return JSON.parse(result);
    });
}

/**
 * Delete a key from thee redis cache
 * @param {string} key the key to delete
 * @returns {Promise<*>}
 */
const redisDelete = async (key) => {
    redis = await initRedisCache();
    return redis.del(key);
}

/**
 * Delete all key that match the key pattern specified
 * @param {string} key the key to match
 * @returns {Promise<void>}
 */
const redisRefreshCache = async (key) => {
    redis = await initRedisCache();
    redis.keys(`*${key}*`).then(async (properties) => {
        for (const property of properties) {
            await redisDelete(property);
        }
    });

}

/**
 * Clears the redis cache
 * @returns {Promise<void>}
 */
const redisFlushAll = async () => {
    redis = await initRedisCache();
    redis.flush();
}

module.exports = {
    redisSet,
    redisGet,
    redisDelete,
    redisRefreshCache,
    redisFlushAll
}
