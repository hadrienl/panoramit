var pg = require('pg'); 
//or native libpq bindings
//var pg = require('pg').native

var conString = "postgres://panoramix@hadrien.eu/panoramix";

var client = new pg.Client(conString);

client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  client.query('SELECT * FROM panoramas WHERE status = 0 ORDER BY date ASC LIMIT 1;', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows);
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
    client.end();
  });
});

