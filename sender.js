const http = require('http');
const crypto = require('crypto');
const secret = "getTHEsecret";
const prefix = "getTHEprefix";
const date = new Date().toGMTString();


var defaultHeaders;
http.get('http://ac3.tre.it/enrichment/login.jsp', (res) => {
  if (res.statusCode == 200) {
    res.on('data', (chunk) => {
      console.log("Got phone number: " + chunk);
      secoundCall(chunk.toString());
      res.resume();
    });
  }
}).on('error', (e) => {
  console.log(`Got error: ${e.message}`);
});


//to get profile
function secoundCall(msisdn) {
  defaultHeaders  = {
    date: date,
    'content-type': 'application/json;charset=UTF-8',
    'user-agent': 'Ver. Android: 6.1.0',
    site: 'mobile',
    siteid: '10',
    app_version: '6.1.0',
    os_version: '6.0.1',
    uat: 'true',
    'x-h3g-msisdn': msisdn,
    host: 'ac3.tre.it',
    connection: 'Keep-Alive',
    'accept-encoding': 'gzip'
  };

  var headers = {"resource":"/api/restService/mosaic/mosaicprofile"};
  var postData = JSON.stringify({"msisdn": msisdn});
  request(headers, postData, (data) => {
    var profile = data.response.profile;
    nextCalls(msisdn, profile);
  });
}

function nextCalls(msisdn, profile) {
  //to get the remaining credit
  var headers = { date: date,
    profile: profile,
    widgetinstanceid: '14', //should be dynamic
    resource: '/api/restService/mosaic/w12_creditoricarica'
  };

  var postData = JSON.stringify({"msisdn": msisdn});
  request(headers, postData);

  //to get the remaining trafic
  var headers = { date: date,
    profile: profile,
    widgetinstanceid: '5', //should be dynamic
    resource: '/api/restService/mosaic/w3_offer'
  };
  var postData = JSON.stringify({"msisdn": msisdn,"consenso":true});
  request(headers, postData);
}
function request (headers, postData, callback) {
  for(var key in defaultHeaders)
    headers[key]=defaultHeaders[key];

  var options =  {};
  var token = ("POST\n\n" + headers["content-type"] + "\n" + headers.date + "\n" + headers.resource);
  var hmac = crypto.createHmac('sha256', secret);
  hmac.update(token);
  headers.authorization = prefix + hmac.digest('base64');
  //console.log(headers);

  options.host = headers.host
  options.method = "POST";
  options.path = headers.resource;
  options.headers = headers;
  var allData = '';
  var req = http.request(options, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      allData += chunk;
    });
    res.on('end', () => {
      try {
        if (callback) {
          callback(JSON.parse(allData));
        }
        else
          console.log(JSON.stringify(JSON.parse(allData), null, 2));
      }
      catch (e) {
        console.log("No json data");
      }
    })
  });

  req.on('error', (e) => {
    console.log(`problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
}


function parseData(data) {
  if (data.success) {
    var profile = data.response.profile;
    var widgets = data.response.widgets;
    //[{ widgetInstanceId: '14', title: 'CREDITO', key: 'w12_creditoricarica' },
    // { widgetInstanceId: '5', title: 'TARIFFA', key: 'w3_offer' }]
  }
}
