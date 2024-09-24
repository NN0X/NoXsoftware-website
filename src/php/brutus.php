<?php
function runBrutus($key, $message)
{
	$output = shell_exec('echo "123");
	return $output;
}

if (isset($_POST['key']) && isset($_POST['message']))
{
	echo runBrutus($_POST['key'], $_POST['message']);
}
?>
