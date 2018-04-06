<?php
// include_once("../util/sanitize.php");

// jSON URL which should be requested
$id = isset($_REQUEST["id"]) ? $_REQUEST["id"] : "0";
$type = isset($_REQUEST["type"]) ? $_REQUEST["type"] : "short_range";
// $id = isset($_REQUEST["id"]) ? sanitize($_REQUEST["id"], "FLOAT") : "0";
$json_url = "https://nwmdata.nohrsc.noaa.gov/0.2/forecasts/".$type."/streamflow?station_id=".$id;

// Initializing curl
$ch = curl_init( $json_url );

// Configuring curl options
$options = array(
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_HTTPHEADER => array('Content-type: application/json')
);

// Setting curl options
curl_setopt_array($ch, $options );

// Get result
$result =  curl_exec($ch);
echo $result;

?>