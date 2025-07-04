<?php
function sanitizeInput($data)
{
        $data = preg_replace('/[0-9\p{P}\p{S}]/u', '', $data);
        return htmlspecialchars(strip_tags($data), ENT_QUOTES, 'UTF-8');
}

function sanitizeOutput($data)
{
        return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

function runCicero($message)
{
        $message = escapeshellarg(sanitizeInput($message));
        $output = shell_exec("./../exec/cicero -i $message '../exec/dictionaries/2^16.tok'");
        $output = sanitizeOutput($output);
        return $output;
}

if (isset($_POST['message']))
{
        echo runCicero($_POST['message']);
}
?>
