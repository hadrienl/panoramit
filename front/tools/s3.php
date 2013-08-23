<?php

include('../../libs/amazon-s3-php-class/S3.php');

$config = parse_ini_file('../../config/config.ini');

$s3 = new S3($config['awsAccessKey'], $config['awsSecretKey']);

$file = 'fixture.jpg';

$s3->putObject(
	S3::inputResource(fopen($file, 'rb'), filesize($file)),
	'panoramit',
	'test/fixture.jpg',
	S3::ACL_PUBLIC_READ
);