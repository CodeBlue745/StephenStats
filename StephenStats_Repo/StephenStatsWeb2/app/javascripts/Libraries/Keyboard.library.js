function arrowKeyInput(event) {
	//event.which is for older browsers. event.keyCode is for newer browsers.
	var KEY = event.which || event.keyCode;
	if (KEY == 37){
		var leftArrow = 37;
		console.log(leftArrow);
	}
	/*Change*/
	if (KEY == 38){
		var upArrow;
		console.log(upArrow);
	}
	if (KEY == 39){
		var rightArrow = 39;
		console.log(rightArrow);
	}
	if (KEY == 40){
		var downArrow = 40;
		console.log(downArrow);
	}
}

function alphabetKeyInput(event){
	var KEY = event.which || event.keyCode;
	x = [];
	for(i=65; i < 91; i++){
		x.append(i - 65);
		console.log(event);
	}
	console.log(x);
	if (KEY == 37){
		var leftArrow = 37;
		console.log(leftArrow);
	}
}