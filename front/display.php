<?php
$id = isset($_GET['id']) ? $_GET['id'] : null;

if (!is_numeric($id))
{
    header("HTTP/1.0 404 Not Found");
    echo "No panorama found.\n";
    exit;
}
/**
 * Fetch panoram from db
 */
$conn = pg_pconnect("user=panoramit dbname=panoramit");
if (!$conn) {
    header("HTTP/1.0 500 No database");
    echo "No database found.\n";
    exit;
}
/**
 * Insert new entry with uploading status
 */
$result = pg_query($conn,
    "SELECT * FROM panoramas WHERE id=".pg_escape_string($id).";"
);

if (!$result) {
    header("HTTP/1.0 404 Not Found");
    echo "No panorama found.\n";
    exit;
}

while ($row = pg_fetch_row($result)) {
    $panorama = (object)array(
        'id'    => $row[0],
        'id_user'   => $row[1],
        'status'    => $row[2],
        'date'      => $row[3],
        'height'    => $row[4],
        'width'     => $row[5]
    );
}

if (!$panorama || $panorama->status != 3)
{
    header("HTTP/1.0 404 Not Found");
    echo "No panorama found.\n";
    exit;
}

$name = $panorama->id;
$width = $panorama->width;
$height = $panorama->height;

?>
<html>
<head>
    <script type="text/javascript" src="http://panoram.it/assets/panojs/extjs/ext-core.js"></script>
    <script type="text/javascript" src="http://panoram.it/assets/panojs/panojs/utils.js"></script>    
    <script type="text/javascript" src="http://panoram.it/assets/panojs/panojs/PanoJS.js"></script>
    <script type="text/javascript" src="http://panoram.it/assets/panojs/panojs/controls.js"></script>
    <script type="text/javascript" src="http://panoram.it/assets/panojs/panojs/pyramid_imgcnv.js"></script>
    <script type="text/javascript" src="http://panoram.it/assets/panojs/panojs/control_thumbnail.js"></script>
    <script type="text/javascript" src="http://panoram.it/assets/panojs/panojs/control_info.js"></script>
    <script type="text/javascript" src="http://panoram.it/assets/panojs/panojs/control_svg.js"></script>

    <link rel="stylesheet" href="http://hadrien.eu/panoramas/panojs/styles/panojs.css" />

    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            font-family: 'helvetica neue', helvetica, arial, sans-serif;
        }
        a {
            color: white;
            text-decoration: none;
        }
        .viewerctn {
            height: auto;
            width: 100%;
        }
        .viewer {
            width: 100%;
            height: 100%;
        }
        .viewer .info {
            top: 0;
            height: 20px;
        }
        .logo {
            position: absolute;
            bottom: 0;
            left: 0;
            font-size: 30px;
            color: white;
            opacity: .8;
            z-index: 999999999;
        }
    </style>
</head>
<body>
    <div class="viewerctn">
        <div id="viewer1" class="viewer"></div>
    </div>

    <a class="logo" href="http://hadrien.eu">
        hosted by Hadrien.eu
    </a>
<script type="text/javascript">
// <![CDATA[

PanoJS.MSG_BEYOND_MIN_ZOOM = null;
PanoJS.MSG_BEYOND_MAX_ZOOM = null;
PanoJS.STATIC_BASE_URL = 'http://hadrien.eu/panoramas/panojs/';
var viewer = null;

function createViewer( viewer, dom_id, url, prefix, w, h ) {
    if (viewer) return;
  
    var MY_URL      = url;
    var MY_PREFIX   = prefix;
    var MY_TILESIZE = 256;
    var MY_WIDTH    = w;
    var MY_HEIGHT   = h;
    var myPyramid = new ImgcnvPyramid( MY_WIDTH, MY_HEIGHT, MY_TILESIZE);
    
    var myProvider = new PanoJS.TileUrlProvider('','','');
    myProvider.assembleUrl = function(xIndex, yIndex, zoom) {
        return MY_URL + '/' + MY_PREFIX + myPyramid.tile_filename( zoom, xIndex, yIndex );
    }    
    
    viewer = new PanoJS(dom_id, {
        tileUrlProvider : myProvider,
        tileSize        : myPyramid.tilesize,
        maxZoom         : myPyramid.getMaxLevel(),
        imageWidth      : myPyramid.width,
        imageHeight     : myPyramid.height,
        blankTile       : PanoJS.STATIC_BASE_URL+'images/blank.gif',
        loadingTile     : PanoJS.STATIC_BASE_URL+'images/progress.gif'
    });

    Ext.EventManager.addListener( window, 'resize', callback(viewer, viewer.resize) );
    viewer.init();

    document.getElementsByClassName('maximize')[0].addEventListener(
        'click',
        function()
        {
            var el = document.documentElement;

            if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement)
            {
                if(document.cancelFullScreen) {
                    document.cancelFullScreen();
                } else if(document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if(document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                }
            }
            else
            {
                if(el.requestFullScreen) {
                    el.requestFullScreen();
                } else if(el.webkitRequestFullScreen) {
                    el.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                } else if(el.mozRequestFullScreen){
                    el.mozRequestFullScreen();
                }
            }
        }
    );
};


function initViewers() {
  createViewer( viewer, 'viewer1', 'http://panoramit.s3.amazonaws.com/<?php echo $name; ?>', 'tile_', <?php echo $width ?>,  <?php echo $height; ?> );
}
  
Ext.onReady(initViewers);

// ]]>
</script>
</body>
</html>