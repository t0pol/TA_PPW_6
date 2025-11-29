<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
$API_KEY = 'f613207b77d36241303f59027ada92d3';
$action = isset($_GET['action'])?$_GET['action']:'';
if($action==='geocode'){
  $q = isset($_GET['q'])?$_GET['q']:'';
  if($q===''){http_response_code(400); echo json_encode([]); exit;}
  $url = "https://api.openweathermap.org/geo/1.0/direct?q=".urlencode($q)."&limit=5&appid=".$API_KEY;
  $res = file_get_contents($url);
  if($res===false){http_response_code(502); echo json_encode(['error'=>'failed']); exit;}
  echo $res; exit;
}
if($action==='current'){
  $lat = isset($_GET['lat'])?$_GET['lat']:null;
  $lon = isset($_GET['lon'])?$_GET['lon']:null;
  $units = isset($_GET['units'])?$_GET['units']:'metric';
  if($lat===null||$lon===null){http_response_code(400); echo json_encode(['error'=>'missing coords']); exit;}
  $url = "https://api.openweathermap.org/data/2.5/weather?lat=".urlencode($lat)."&lon=".urlencode($lon)."&units=".urlencode($units)."&appid=".$API_KEY;
  $res = file_get_contents($url);
  if($res===false){http_response_code(502); echo json_encode(['error'=>'failed']); exit;}
  echo $res; exit;
}
if($action==='forecast'){
  $lat = isset($_GET['lat'])?$_GET['lat']:null;
  $lon = isset($_GET['lon'])?$_GET['lon']:null;
  $units = isset($_GET['units'])?$_GET['units']:'metric';
  if($lat===null||$lon===null){http_response_code(400); echo json_encode(['error'=>'missing coords']); exit;}
  $url = "https://api.openweathermap.org/data/2.5/forecast?lat=".urlencode($lat)."&lon=".urlencode($lon)."&units=".urlencode($units)."&appid=".$API_KEY;
  $res = file_get_contents($url);
  if($res===false){http_response_code(502); echo json_encode(['error'=>'failed']); exit;}
  echo $res; exit;
}
http_response_code(400);
echo json_encode(['error'=>'invalid action']);
