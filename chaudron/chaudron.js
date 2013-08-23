var pg = require('pg'),
    AWS = require('aws-sdk'),
    Chaudron = function(config)
    {
        this.init(config);
    };

AWS.config.loadFromPath('../config/config.json');

Chaudron.prototype = {

    _host: '',
    _user: '',
    _db: '',

    _client: null,

    init: function(config)
    {
        var config = config || {};

        this._host = config.host;
        this._user = config.user;
        this._db = config.db;
    },

    destroy: function()
    {
        this._client.end();
    },

    /**
     * Mix the chaudron of magic potion
     */
    mix: function(callback)
    {
        this._end = function()
        {
            this._client && this._client.end();
            callback && callback();

        }.bind(this)

        this._connect();
    },

    /**
     * Connect to database
     */
    _connect: function()
    {
        this._client = new pg.Client("postgres://"+this._user+"@"+this._host+"/"+this._db);

        this._client.connect(function(err)
        {
            if (err)
            {
                console.error('could not connect to postgres', err);
                return this._end();
            }

            this._getNextTask();

        }.bind(this));
    },

    /**
     * Get the last task
     */
    _getNextTask: function()
    {
        this._client.query('SELECT * FROM panoramas WHERE status = 1 ORDER BY date ASC LIMIT 1;', function(err, result)
        {
            if (err)
            {
                console.error('error running query', err);
                return this._end();
            }

            if (!result.rows.length)
            {
                console.error('No task');
                return this._end();
            }

            this._process(result.rows[0]);

        }.bind(this));
    },

    /**
     * Set the task status as processing
     */
    _process: function(task)
    {
        console.warn("Processing task #"+task.id);

        this._client.query('UPDATE panoramas SET status = 2 WHERE id = '+task.id, function(err, result)
        {
            if (err)
            {
                console.error('error running query', err);
                return this._end();
            }

            this._retreiveOriginal(task);

        }.bind(this));
    },

    /**
     * Retreive original picture from S3
     */
    _retreiveOriginal: function(task)
    {
        var s3 = new AWS.S3();

        s3.createBucket({Bucket: 'myBucket'}, function() {
        
        var s3 = new AWS.S3();
        var params = {Bucket: 'panoramit', Key: task.id+'/original.jpg'};
        var file = require('fs').createWriteStream('./tmp/original.jpg');
        //s3.on
        s3.getObject(params, function(err, data)
        {
            console.warn(err, data);
            this._end();
        }.bind(this)).createReadStream().pipe(file);
});
    }
}

module.exports = Chaudron;