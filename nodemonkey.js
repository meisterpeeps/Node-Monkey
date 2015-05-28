var //Module Imports
    cp          = require('child_process');
    express     = require('express'),
    request     = require('request'),
    bodyParser  = require('body-parser'),
    crypto      = require('crypto'),
    hmac        = crypto.createHmac('sha1', process.env.LEGACY_SECRET),
    slackhook   = process.env.SLACK_HOOK;
var app = express();
var payload;

var slackPull = function(payload,res){
  if(payload.action === "closed"){
    res.json({'Response': 'Pull Request Closed'});
    return;
  }
  var message = payload.pull_request.title;
  var from = payload.pull_request.user.login;
  var url = payload["pull_request"]["html_url"]
  var submitTime = payload.pull_request["created_at"];
  request.post(slackhook,
      {
        json: {
         "link_names":1,
         "attachments":[{
          "fallback": "Pull Request",
          "color" : "#EEA510",
          "title" : "Knock Knock",
          "title_link": url,
          "pretext": "<!group> Pull Request",
          "text": message,
           "fields" : [
            {
              "title": "Submited By",
              "value": from,
              "short": true
            },
           // {
           //   "title": "Recieved By",
          //    "value": to,
          //    "short": true
          //  },
            {
              "title": "Time",
              "value": submitTime,
              "short": false
            }
            ]
         }]
        }
      },
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        }
      }
    );
  res.json({'Response': 'PULL REQUEST SUBMITTED'});
};



var slackPost = function(payload){
 
  var message = payload.commits[0]["message"];
  var from = payload.commits[0]["committer"]["username"];   
  var submitTime = payload.commits[0]["timestamp"];
  request.post(slackhook,
      {
        json: {
         "link_names": 1, 
         "attachments":[{
          "link_names": 1,    
          "fallback": "Successful Deployment",
          "color" : "#7CD197",
          "title" : "Success",
          "pretext": "<!group> New deployment",
          "text":  message,
           "fields" : [
            {
              "title": "Submited By",
              "value": from,
              "short": true
            },
           // {
           //   "title": "Recieved By",
          //    "value": to,
          //    "short": true
          //  },
            {
              "title": "Time",
              "value": submitTime,
              "short": false
            }
            ]
         }]      
        } 
      },
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        }
      } 
    );
};
var deploy = function(payload){
  console.log('Attempting deploy...');
  cp.exec('./deploy.sh', function(err,stdout,stderr){
    if(err)
      console.log(stderr);
    else{
      console.log(stdout);
      slackPost(payload);
     }
    
  });
};

app.listen(7500, function(){
  console.log("Drone Droplet Listening on 7500");
});

app.use(bodyParser.json());

app.post('/deploy', function(req,res){
  payload = req.body;
  hmac.update(JSON.stringify(payload));
  calculatedSignature = 'sha1=' + hmac.digest('hex');
  if (req.headers['x-hub-signature'] === calculatedSignature) {
    console.log('Signatures Match');
    deploy(payload);
    res.json({'Response': 'GREAT JOB'});
  }
  else {
    console.log('not good');
  }
  hmac = crypto.createHmac('sha1', process.env.LEGACY_SECRET);
});

app.post('/pullRequest', function(req,res){
  payload = req.body;
  hmac.update(JSON.stringify(payload));
  calculatedSignature = 'sha1=' + hmac.digest('hex');
  if (req.headers['x-hub-signature'] === calculatedSignature) {
    console.log('Signatures Match');
    slackPull(payload,res);
  }
  else {
    console.log('not good');
  }
  hmac = crypto.createHmac('sha1', process.env.LEGACY_SECRET);
});

