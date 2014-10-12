var express       = require('express')
  , app           = express()
  , http          = require('http')
  , config        = require('./config')(process.env.ENV)
  , path          = require('path')
  , Redis         = require('./db.js')();
;

console.log(path.resolve(__dirname, config.client_dir));

app.set('views', path.resolve(__dirname, config.client_dir));
app.use('/assets', express.static(config.client_dir + '/assets', { maxAge: 10800 }));

// app.use(express.bodyParser());
// app.use(express.methodOverride());
app.engine('html', require('ejs').renderFile);

http.createServer(app).listen(config.port);

app.get('/', function(req, res, next){

  Redis.set("code", req.query.code);
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
