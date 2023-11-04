var mouse = {x: 0, y: 0}
var keys = {}
var jKeys = {}
var touches = {}

addEventListener("mousemove", (event) => {
	mouse = {x: event.clientX-canvas.width/2, y: event.clientY-canvas.height/2}
})

addEventListener("keydown", (event) => {
	if (!keys[event.code]) { jKeys[event.code] = true }
	keys[event.code] = true
})

addEventListener("keyup", (event) => {
	delete keys[event.code]
})

addEventListener("touchstart", (event) => {
	for (let touch of event.changedTouches) {
		touches[touch.identifier] = {x: touch.clientX-canvas.width/2, y: touch.clientY-canvas.height/2}
	}
})

addEventListener("touchmove", (event) => {
	for (let touch of event.changedTouches) {
		let deltaX = touch.clientX-canvas.width/2 - touches[touch.identifier].x
		let deltaY = touch.clientY-canvas.height/2 - touches[touch.identifier].y

		camera.x -= deltaX
		camera.y -= deltaY
		
		touches[touch.identifier] = {x: touch.clientX-canvas.width/2, y: touch.clientY-canvas.height/2}
	}
})

addEventListener("touchend", (event) => {
	for (let touch of event.changedTouches) {
		delete touches[touch.identifier]
	}
})