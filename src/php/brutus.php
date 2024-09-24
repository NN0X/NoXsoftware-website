<?php
function sanitizeInput($data) 
{
	return htmlspecialchars(strip_tags($data), ENT_QUOTES, 'UTF-8');
}

function sanitizeOutput($data) 
{
	return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

function runBrutus($key, $message)
{
	$key = sanitizeInput($key);
	$message = sanitizeInput($message);
	$output = shell_exec(' "$message" "$key"');
	$output = sanitizeOutput($output);
	return $output;
}

if (isset($_POST['key']) && isset($_POST['message']))
{
	echo runBrutus($_POST['key'], $_POST['message']);
}
?>
