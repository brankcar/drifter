var express = require('express');
var redis = require('./models/redis.js');

var app = express();
app.use(express.bodyParser());

/**
 * @param {Number} time [扔漂流瓶时的时间戳]
 * @param {String} owner [用户名或者用户的唯一ID]
 * @param {String} type [漂流瓶的类型] // 'male': 男性 // 'female': 女性 // 'all': 所有
 * @param {String} content [漂流瓶的内容]
 * @param {Number} code [状态码] // 200: 成功 // 100: 失败 // 101: 参数错误  // 102: 缺少参数或参数不完整 // 103: 服务器拒绝执行
 * @param {String} message [状态信息]
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
        res.json(result);
    });
});

var prot = 3000;
app.listen(prot);
console.log('start prot: ' + prot);