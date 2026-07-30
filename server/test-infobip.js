var https = require('https');

var options = {
    'method': 'POST',
    'hostname': 'l24nwj.api.infobip.com',
    'path': '/2fa/2/pin',
    'headers': {
        'Authorization': 'App 74b1997854051fea75fad51b36157edb-1b67fa54-aafd-4006-bfa1-00162551b18e',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

var req = https.request(options, function (res) {
    var chunks = [];
    res.on("data", function (chunk) { chunks.push(chunk); });
    res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        console.log("Status Code:", res.statusCode);
        console.log("Response Body:", body.toString());
    });
    res.on("error", function (error) { console.error("Error:", error); });
});

var postData = JSON.stringify({
    "applicationId": "98BDE587F3BB376AAFD70B1234B8D82B",
    "messageId": "CE24A3FB1F130E4ADD7B321DE5A5F74F",
    "from": "Betswal",
    "to": "254700000000" // Replace with a test number if needed, but let's just see if it errors on sender/auth first
});

req.write(postData);
req.end();
