var express = require('express');
var redis = require('./models/redis.js');
var bodyParser = require('body-parser');
var mongodb = require('./models/mongodb.js');

var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

/**
 * @param {Number} time [扔漂流瓶时的时间戳]
 * @param {String} owner [用户名或者用户的唯一ID]
 * @param {String} type [漂流瓶的类型] // 'male': 男性 // 'female': 女性 // 'all': 所有
 * @param {String} content [漂流瓶的内容]
 * @param {Number} code [状态码] // 200: 成功 // 100: 失败 // 101: 参数错误  // 102: 缺少参数或参数不完整 // 103: 服务器拒绝执行 // 104: 找不到资源
 * @param {String} message [状态文案信息]
 */
/*
{
    time,
    owner,
    type,
    content,
    code,
    message,
}
*/

var type_arr = ["male", "female"];
var shallowProperty = function(key){
    return function(obj) {
        return obj == null ? void 0 : obj[key]
    };
};
var index_of = shallowProperty('indexOf');

// 扔一个漂流瓶
app.post('/', function(req, res) {
    if (!(req.body.owner && req.body.type && req.body.content)) {
        if (req.body.type && (index_of(type_arr)(req.body.type) === -1)) {
            return res.json({code: 101, message: '参数错误：type'});
        }
        return res.json({code: 102, message: '信息不完整'});
    }
    redis.throw(req.body, function(result) {
        res.json(result);
    });
});

// 捡一个漂流瓶
app.get('/', function(req, res) {
    if (!req.query.user) {
        return res.json({code: 102, message: '信息不完整'});
    }
    if (req.query.type && (index_of(type_arr)(req.body.type) === -1)) {
        return res.json({code: 101, message: '参数错误：type'})
    }
    redis.pick(req.query, function(result) {
        if (result.code === 200) {
            mongodb.save(req.query.user, result.msg, function(err) {
                if (err) {
                    return res.json({code: 104, message: "获取漂流瓶失败，请重试"});
                }
                return res.json(result);
            });
        }
        res.json(result);
    });
});

// 将捡到的漂流瓶扔回海里
app.post('/back', function(req, res) {
    redis.throwBack(req.body, function (result) {
        res.json(result);
    });
});

// 获取一个用户的所有漂流瓶
app.get('/user/:user', function(req, res) {
    mongodb.getAll(req.params.user, function(result) {
        res.json(result);
    });
});

// 获取特定 id 的漂流瓶
app.get('/bottle/:_id', function(req, res) {
    mongodb.getOne(req.params._id, function(result) {
        res.json(result);
    });
});

// 回复特定 id 的漂流瓶
app.post('/reply/:_id', function(req, res) {
    if (!(req.body.user && req.body.content)) {
        return res.json({code: 102, message: "回复信息不完整！"});
    }
    mongodb.reply(req.params._id, req.body, function (result) {
        res.json(result);
    });
});

// 删除特定 id 的漂流瓶
app.get('/delete/:_id', function(req, res) {
    mongodb.delete(req.params._id, function(result) {
        res.json(result);
    });
});


var port = 3000;
app.listen(port);
console.log('start port: ' + port);