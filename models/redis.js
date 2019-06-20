var redis = require('redis'),
    client = redis.createClient(),
    client2 = redis.createClient(),
    client3 = redis.createClient(),
    crypto = require('crypto');

// createClient 创建一个 Redis 客户端，默认监听的域名与端口为 127.0.0.1:6379
// 如果需要其他端口可查看 Redis 文档，redis.createClient(port, host, options)
// 扔一个瓶子
exports.throw = function(bottle, callback) {
    // 限制扔瓶子的次数
    client2.SELECT(2, function() {
        client2.GET(bottle.owner, function (err, result) {
            if (result >= 10) {
                return callback({code: 103, message: "今天扔瓶子的机会已经用完啦~"});
            }
            client2.INCR(bottle.owner, function() {
                // 检查是否是当天第一次扔瓶子
                client2.TTL(bottle.owner, function(err, ttl) {
                    if (ttl === -1) {
                        client2.EXPIRE(bottle.owner, 86400);
                    }
                });
            });
            // 当 bottle 对象中不存在 time 属性将赋值为当前时间戳
            bottle.time = bottle.time || Date.now();
            // 生成一个 16 进制的随机数与 type 和 time 属性拼接，type 为命名空间
            // crypto.createHash().update() 执行之后只能调用一次 .digest 方法，所以在这里需要每次执行 createHash 
            var uid = Math.random().toString(16) + '_' + bottle.time;
            var bottleId = crypto.createHash('md5').update(bottle.type + '_' + uid).digest("hex");
            bottle.owner = bottleId;
            // 根据不同的 type 确定保存数据的数据库
            // 0 - 15 Redis 总共 16 个数据库
            var type = {
                male: 0,
                female: 1
            };
            // 根据漂流瓶 type 属性的不同将漂流瓶保存到不同的数据库
            // 这个操作是异步操作，可能会造成两个 Redis 数据库的数据串联，可以考虑使用 Promise
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
                });
            });
        });
    });
};

// 捡一个瓶子
exports.pick = function(info, callback) {
    // 3 号数据库存放捡瓶子次数
    client3.SELECT(3, function() {
        client3.get(info.user, function() {
            if (result >= 10) {
                return callback({code: 103, message: "今天捡瓶子的机会已经用完啦~"});
            }
            client3.INCR(info.user, function() {
                client3.TTL(info.user, function(err, ttl) {
                    if (ttl) {
                        client3.EXPIRE(info.user, 86400);
                    }
                });
            });
            var type = {
                all: Math.round(Math.random()),
                male: 0,
                female: 1
            };
            info.type = info.type || 'all';
            // 根据 type 确定到不同数据库中获取瓶子
            client.SELECT(type[info.type], function() {
                // 随机返回一个漂流瓶 ID
                client.RANDOMKEY(function(err, bottleId) {
                    if (!bottleId || Math.random() <= 0.2) {
                        return callback({code: 104, message: '海星'});
                    }
                    // 根据漂流瓶 ID 取到漂流瓶完整信息
                    client.HGETALL(bottleId, function(err, bottle) {
                        if (err) {
                            return callback({code: 104, message: '漂流瓶破损了...'});
                        }
                        // 返回结果，成功找到漂流瓶时返回该漂流瓶数据
                        callback({code: 200, data: bottle, message: "捞到一个漂流瓶~"});
                        // 从 Redis 缓存中删除已经捞出的漂流瓶
                        client.DEL(bottleId);
                    });
                });
            });
        });
    });
};

// 将捡到的漂流瓶扔回海里
exports.throwBack = function(bottle, callback) {
    var type = {
        male: 0,
        female: 1
    };
    var uid = Math.random().toString(16) + '_' + bottle.time;
    var bottleId = crypto.createHash('md5').update(bottle.type + '_' + uid).digest("hex");
    bottle.owner = bottleId;
    client.SELECT(type[bottle.type], function() {
        // redis 保存漂流瓶对象
        client.HMSET(bottleId, bottle, function(err, result) {
            if (err) {
                return callback({code: 103, message: '过会儿再试试吧！'});
            }
            // 返回结果
            callback({code: 200, message: result});
            client.PEXPIRE(bottleId, bottle.time + 86400000 - Date.now());
        })
    })
}