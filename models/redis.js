var redis = require('redis'),
    client = redis.createClient();

// 扔一个瓶子
exports.throw = function(bottle, callback) {
    // 当 bottle 对象中不存在 time 属性将赋值为当前时间戳
    bottle.time = bottle.time || Date.now();
    // 生成一个随机ID
    bottleId = Math.random().toString(16);
    // 根据不同的 type 确定保存数据的数据库
    // 0 - 15 Redis 总共 16 个数据库
    var type = {
        male: 0,
        female: 1
    };
    // 根据漂流瓶 type 属性的不同将漂流瓶保存到不同的数据库
    client.SELECT(type[bottle.type], function() {
        // 以 hash 类型保存漂流瓶对象
        client.HMSET(bottleId, bottle, function(err, result) {
            if (err) {
                return callback({code: 103, message: '过会儿再试试吧！'});
            }
            // 返回结果
            callback({code: 200, message: result});
            // 设置缓存的生存期限为 1 天 => 1000 * 60 * 60 * 24 => 86400 秒
            client.EXPIRE(bottleId, 86400);
        })
    })
}