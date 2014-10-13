var express       = require('express')
  , app           = express()
  , http          = require('http')
  , config        = require('./config')(process.env.ENV)
  , path          = require('path')
;

var redis_url = config.redis;

var rtg   = require("url").parse(redis_url);
var redis = require("redis").createClient(rtg.port, rtg.hostname);

redis.auth(rtg.auth.split(":")[1]);

console.log(path.resolve(__dirname, config.client_dir));

app.set('views', path.resolve(__dirname, config.client_dir));
app.use('/assets', express.static(config.client_dir + '/assets', { maxAge: 10800 }));

// app.use(express.bodyParser());
// app.use(express.methodOverride());
app.engine('html', require('ejs').renderFile);

http.createServer(app).listen(config.port);

app.get('/', function(req, res, next){

  if(req.query.code){
    redis.set("code", req.query.code, function(err){ if(err) console.log(err) });
    redis.get("code", function(err, stuff){
      console.log(stuff);
    })
  }
  res.render('index.html', {});

  next();

})


app.all('*', function (req, res, next) {

  if (req.params[0].match(/\.(png|jpg|jpeg|gif|css|js|mp3|swf)$/)) {
    res.header("Cache-Control", "public, max-age=31104000");
    return next()
  }

});

console.log(config.host + ':' + config.port);
