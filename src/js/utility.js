function preventCaching() {
        window.onpageshow = function(event) {
		if (event.persisted) {
			window.location.reload();
		}
	};}

function delay(url, time) 
{
        // time in milliseconds
        setTimeout( function() { window.location = url }, time );
}

function moveTo(id, time, targetX, targetY)
{
        const div = document.getElementById(id);
        console.log("Object: " + div.id + " moving to " + targetX + ", " + targetY);
        const divX = div.getBoundingClientRect().left;
	const divY = div.getBoundingClientRect().top;

        const parent = div.parentElement;
        const children = Array.from(parent.children).filter(child => child !== div);

        const copy = div.cloneNode(true);
        copy.style.opacity = 0;
        parent.insertBefore(copy, div);

        children.forEach(child => child.style.pointerEvents = "none");
        children.forEach(child => {
                child.style.transition = `opacity ${time}ms ease`;
                child.style.opacity = 0;
        });

        div.style.position = "absolute";
        div.style.left = divX + "px";
        div.style.top = divY + "px";
        // make sure the div is above all other elements
        div.style.zIndex = 1000;

	const translateX = targetX - divX;
	const translateY = targetY - divY;
	div.style.transition = `transform ${time}ms ease`;
	div.style.transform = `translate(${translateX}px, ${translateY}px)`;
}
