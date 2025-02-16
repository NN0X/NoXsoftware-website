<?php
function sanitizeInput($data)
{
        return htmlspecialchars(strip_tags($data), ENT_QUOTES, 'UTF-8');
}

function sanitizeOutput($data)
{
        return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

function runBrutus($message)
{
        $message = escapeshellarg(sanitizeInput($message));
        $output = shell_exec("./../exec/cicero -i $message");
        $output = sanitizeOutput($output);
        return $output;
}

if (isset($_POST['key']) && isset($_POST['message']))
{
        echo runCicero($_POST['message']);
}
?>
