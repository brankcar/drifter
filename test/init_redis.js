var request = require('request');

for (var i = 1; i <= 5; i++) {
    (function(i) {
        request.post({
            url: "http://127.0.0.1:3000",
            form: {
                "owner": "bottle" + i,
                "type": 'male',
                "content": "content" + i
            }
        }, function(err, res, body) {
            // console.log(body)
        });
    })(i);
}
for (var i = 6; i <= 10; i++) {
    (function(i) {
        request.post({
            url: "http://127.0.0.1:3000",
            form: {
                "owner": "bottle" + i,
                "type": 'female',
                "content": "content" + i
            }
        }, function(err, res, body) {
            // console.log(body)
        });
    })(i);
}