function runBrutus(key, message)
{
        // get the key and message from the user
        var key = document.getElementById(key).value;
        var message = document.getElementById(message).value;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/php/brutus.php", true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send("key=" + key + "&message=" + message);
        xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status == 200) {
                        document.getElementById("output").innerHTML = xhr.responseText;
                        console.log(xhr.responseText);
                }
        }
}
