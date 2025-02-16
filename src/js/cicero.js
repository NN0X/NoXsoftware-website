function runCicero(messageId)
{
        const message = document.getElementById(messageId).value;

        if (message == "")
        {
                document.getElementById("output").innerText = "Please enter message.";
                return;
        }

        if (message.length > 50)
        {
                document.getElementById("output").innerText = "The message must be at most 50 characters.";
                return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/php/cicero.php", true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send("message=" + message);
        xhr.onreadystatechange = function() 
        {
                if (xhr.readyState == 4 && xhr.status == 200) 
                {
                        if (xhr.responseText == "")
                        {
                                document.getElementById("output").innerText = "";
                                return;
                        }
                        const output = xhr.responseText.slice(0, -1);
                        document.getElementById("output").innerText = xhr.responseText;
                }
        }
}

function onEnter(messageId)
{
        if (window.event.keyCode == 13)
                runCicero(messageId);
}
