var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/drifter");


/**
 * {
 *   bottle: ["$picker","$owner"],
 *   message: [
 *      ["$owner","$time","$content"],
 *      ["$piker","$time","$content"]
 *   ]
 * }
 */
var bottleModel = mongoose.model('Bottle', new mongoose.Schema({
    bottle: Array,
    message: Array
},{
    collection: 'bottles'
}));

// 保存漂流瓶数据
exports.save = function(picker, _bottle, callback) {
    var bottle = {
        bottle: [],
        message: []
    };
    bottle.bottle.push(picker);
    bottle.message.push([_bottle.owner, _bottle.time, _bottle.content]);
    bottle = new bottleModel(bottle);
    bottle.save(function(err) {
        callback(err);
    });
};

// 获取用户漂流瓶列表
exports.getAll = function(user, callback) {
    bottleModel.find({"bottle": user}, function(err, bottles) {
        if (err) {
            return callback({code: 104, message: '获取漂流瓶列表失败...'});
        }
        callback({code: 200, message: bottles});
    });
};

// 获取特定 id 的漂流瓶
exports.getOne = function(_id, callback) {
    bottleModel.findById(_id, function(err, bottle) {
        if (err) {
            return callback({code: 103, message: "读取漂流瓶失败..."});
        }
        callback({code: 200, message: bottle});
    });
};

// 回复特定 id 的漂流瓶
exports.reply = function(_id, reply, callback) {
    reply.time = reply.time || Date.now();
    bottleModel.findById(_id, function(err, _bottle) {
        if (err) {
            return callback({code: 101, message: "回复漂流瓶失败..."});
        }
        var newBottle = {};
        newBottle.bottle = _bottle.bottle;
        newBottle.message = _bottle.message;

        // 如果捡瓶子的人第一次回复该漂流瓶，则在 bollte 键添加漂流瓶主人
        if (newBottle.bottle.length === 1) {
            newBottle.bottle.push(_bottle.message[0][0]);
        }
        newBottle.message.push([reply.user, reply.time, reply.content]);

        bottleModel.findByIdAndUpdate(_id, newBottle, function(err, bottle) {
            if (err) {
                return callback({code: 102, message: '回复失败...'});
            }
            callback({code: 200, message: bottle});
        })
    })
}