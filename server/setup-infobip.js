var https = require('follow-redirects').https;

var options = {
    'method': 'POST',
    'hostname': 'l24nwj.api.infobip.com',
    'path': '/2fa/2/applications',
    'headers': {
        'Authorization': 'App 74b1997854051fea75fad51b36157edb-1b67fa54-aafd-4006-bfa1-00162551b18e',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    'maxRedirects': 20
};

var req = https.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
        chunks.push(chunk);
    });

    res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        console.log(body.toString());
    });

    res.on("error", function (error) {
        console.error(error);
    });
});

var postData = JSON.stringify({
    "name": "Betswal 2FA Application",
    "enabled": true,
    "configuration": {
        "pinAttempts": 10,
        "allowMultiplePinVerifications": true,
        "pinTimeToLive": "15m",
        "verifyPinLimit": "1/3s",
        "sendPinPerApplicationLimit": "100/1d",
        "sendPinPerPhoneNumberLimit": "10/1d"
    }
});

req.write(postData);
req.end();
