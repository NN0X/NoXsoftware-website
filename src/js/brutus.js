function runBrutus(keyId, messageId)
{
        const key = document.getElementById(keyId).value;
        const message = document.getElementById(messageId).value;

        if (key == "" && message == "")
        {
                document.getElementById("output").innerText = "Please enter key and message.";
                return;
        }

        if (key == "" && message != "")
        {
                document.getElementById("output").innerText = "Please enter key.";
                return;
        }

        if (message == "" && key != "")
        {
                document.getElementById("output").innerText = "Please enter message.";
                return;
        }


        if (key.length < 3)
        {
                document.getElementById("output").innerText = "The key must be at least 3 characters.";
                return;
        }

        if (key.length > 50)
        {
                document.getElementById("output").innerText = "The key must be at most 50 characters.";
                return;
        }

        if (message.length > 50)
        {
                document.getElementById("output").innerText = "The message must be at most 50 characters.";
                return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/php/brutus.php", true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send("key=" + key + "&message=" + message);
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

function onEnter(keyId, messageId)
{
        if (window.event.keyCode == 13)
                runBrutus(keyId, messageId);
}
