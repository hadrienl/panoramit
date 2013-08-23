<?php

$id = null;
$id_user = 1;

$conn = pg_pconnect("user=panoramit dbname=panoramit");
if (!$conn) {
  echo "Une erreur s'est produite.\n";
  exit;
}
/**
 * Insert new entry with uploading status
 */

$result = pg_query($conn,
	"INSERT INTO panoramas(id_user, status) VALUES (".$id_user.", 0) RETURNING Currval('panoramas_id_seq');"
);

if (!$result) {
  echo "Une erreur s'est produite.\n";
  exit;
}

while ($row = pg_fetch_row($result)) {
  $id = $row[0];
}

if (!$id)
{
	echo "Une erreur s'est produite.\n";
	exit;
}

/**
 * Upload file
 */
include('../../libs/amazon-s3-php-class/S3.php');

$config = parse_ini_file('../../config/config.ini');

$s3 = new S3($config['awsAccessKey'], $config['awsSecretKey']);

$file = 'fixture.jpg';

$s3->putObject(
	S3::inputResource(fopen($file, 'rb'), filesize($file)),
	'panoramit',
	$id.'/original.jpg',
	S3::ACL_PUBLIC_READ
);

$result = pg_query($conn,
	"UPDATE panoramas SET status = 1 WHERE id = ".$id
);
