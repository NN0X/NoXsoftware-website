function runBrutus(key, message)
{
        // call php function to run brutus
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/php/brutus.php", true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send("key=" + key + "&message=" + message);
        xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status == 200) {
                        alert(xhr.responseText);
                }
        }
}
