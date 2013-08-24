var pg = require('pg'),
    AWS = require('aws-sdk'),
    http = require('http'),
    fs = require('fs'),
    exec = require('child_process').exec,
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
        console.log('start mix', new Date().toString());
        this._end = function()
        {
            /**
             * TODO rm tmp dir
             */
            this._client && this._client.end();
            callback && callback();
            console.log('end mix', new Date().toString());

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
        /**
         * Start by create tmp directory
         */
        fs.mkdir(
            './tmp/'+task.id,
            function(err)
            {
                /**
                 * Download original file from http
                 */
                var originalurl = 'http://panoramit.s3.amazonaws.com/'+task.id+'/original.jpg',
                    request = http.get(originalurl, function(res)
                    {
                        var imagedata = ''
                        res.setEncoding('binary')

                        res.on('data', function(chunk)
                        {
                            imagedata += chunk
                        })

                        res.on('end', function()
                        {
                            /**
                             * Write file on tmp filesystem
                             */
                            fs.writeFile('./tmp/'+task.id+'/original.jpg', imagedata, 'binary', function(err)
                            {
                                if (err)
                                {
                                    console.error('can\'t save file');
                                    return this._end();
                                }
                                
                                this._makeTiles(task);
                            }.bind(this))

                        }.bind(this));

                    }.bind(this));
            }.bind(this)
        );
    },

    /**
     * Exec the imgcnv command to make tiles files
     */
    _makeTiles: function(task)
    {
        var cmd = 'imgcnv -i ./tmp/'+task.id+'/original.jpg -o ./tmp/'+task.id+'/tile.jpg -t jpeg -tile 256 -options "quality 75"';

        exec(cmd, function(err, stdout, stderr)
        {
            /**
             * Command will always return an error :/
             * But ! If everything is working fine, command will not be killed
             */
            if (err.code === 137)
            {
                console.error('error!!! Not enough RAM');
                return this._end();
            }

            this._uploadTiles(task);

        }.bind(this));
    },

    /**
     * Upload tiles to S3
     */
    _uploadTiles: function(task)
    {
        var path = './tmp/'+task.id+'/',
            /**
             * List tiles files
             */
            files = fs.readdirSync(path),

            s3 = new AWS.S3(),

            next = function()
            {
                var file = files[0];

                data = fs.readFileSync(path+file);

                s3.putObject({
                    Bucket: 'panoramit',
                    Key: task.id+'/'+file,
                    Body: data,
                    ACL: 'public-read'
                }, function(err, data)
                {
                    if (err)
                    {
                        console.error(err);
                        return this._end();
                    }

                    files.shift();

                    if (!files.length)
                    {
                        return this._validate(task);
                    }

                    next();

                }.bind(this));
            }.bind(this);

        next();
    },

    /**
     * Set task as validated
     */
    _validate: function(task)
    {
        console.warn('Validating task #'+task.id);

        /**
         * Update panorama status to Valid
         */
        this._client.query('UPDATE panoramas SET status = 3 WHERE id = '+task.id, function(err, result)
        {
            if (err)
            {
                console.error('error running query', err);
                return this._end();
            }

            /**
             * End task
             */
            this._end();

        }.bind(this));
    }
}

module.exports = Chaudron;