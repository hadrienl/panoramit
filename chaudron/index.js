var chaudron = new (require('./chaudron'))({
		host: 'hadrien.eu',
		user: 'panoramit',
		db: 'panoramit'
	}),
	next = function()
	{
		setTimeout(
			function()
			{
				chaudron.mix(next);
			},
			1000
		);
	};

next();
