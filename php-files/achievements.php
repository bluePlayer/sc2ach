<?php

	$response = array();
	$response["msg"] = "";
	
	if(!isset($_GET['region']) || $_GET['region'] == NULL)
	{
		$_GET['region'] = "us.battle.net";
		$response["msg"] .= "Region is not set. Default: us.battle.net. ";
	}
	if(!isset($_GET['locale']) || $_GET['locale'] == NULL)
	{
		$_GET['locale'] = "en_US";
		$response["msg"] .= "Locale is not set. Default: en_US. ";
	}
	
	$url = "http://".$_GET['region']."/api/sc2/data/achievements?locale=".$_GET['locale'];
	$sc2data = file_get_contents($url);
	$sc2dataArray = json_decode($sc2data, true);
	
	if($sc2dataArray == NULL)
	{
		$response["success"] = false;
		$response["msg"] .= "Cannot load data! No Internet or other problem? ";
	}
	else
	{
		if(isset($sc2dataArray["status"]) && $sc2dataArray["status"] == "nok")
		{
			$response["success"] = false;
			$response["msg"] .= "Error! Reason: ".$sc2dataArray["reason"];
		}
		else
		{
			$response["success"] = true;
			$response["msg"] .= "Achievements loaded succesfully!";
		}
	}
	$response["data"] = $sc2dataArray;
	
	echo json_encode($response);
?>