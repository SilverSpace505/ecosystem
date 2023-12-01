
var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")

var creatures = []

var startCreatures = 50

var maxCreatures = 200

var food = []

var spawn = {x: 0, y: 0}

var foodAmount = 0

var camera = {x: 0, y: 0, zoom: 1}

var foodSpawnSize = 2000
var creatureSpawnSize = 0

var netManager = new Worker("netManager.js")

function createCreature(i) {
	if (creatures.length >= maxCreatures) { return }
	creatures.push(new Creature(Math.random()*creatureSpawnSize*2-creatureSpawnSize, Math.random()*creatureSpawnSize*2-creatureSpawnSize, 5))
	creatures[i].mutate(10, 75, 0, 0)
	creatures[i].setupNet()
	creatures[i].net.mutate(100, 50, 10, 50, 10, 50, 100, 25, 100, 25)
	creatures[i].food = Object.keys(creatures[i].tiles).length * 100
}

function spawnStart() {
	for (let i = 0; i < startCreatures; i++) {
		createCreature(creatures.length)
	}
}
function duplicate() {
	let im = creatures.length
	for (let i = 0; i < im; i++) {
		creatures[i].duplicate()
	}
}
spawnStart()

var lastTime = 0

var time = 0

var fps = 0

var autoSpawn = true

var creatureI = 0

var netTick = 0
var netTickI = 0

var followBest = false
var showRaycasts = false

var tickTime = 0
var tickInt = 0.05

var animFPS = 0

var dots = []

function updateIndexes() {
	for (let i in creatures) {
		creatures[i].i = i
	}
}

function tick(timestamp) {
	requestAnimationFrame(tick)

	delta = (timestamp - lastTime) / 1000
	lastTime = timestamp
	if (1/delta > animFPS) {
		animFPS = Math.round(1/delta)
	}
	if (!delta) { delta = 0 }
	if (delta > 0.1) { delta = 0.1 }

	time += delta

	canvas.width = window.innerWidth
	canvas.height = window.innerHeight

	ctx.fillStyle = "black"
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	if (!camera.x) camera.x = 0
	if (!camera.y) camera.y = 0

	let speed = 500
	if (keys["KeyW"]) {
		camera.y -= speed/camera.zoom*delta
	}
	if (keys["KeyS"]) {
		camera.y += speed/camera.zoom*delta
	}
	if (keys["KeyA"]) {
		camera.x -= speed/camera.zoom*delta
	}
	if (keys["KeyD"]) {
		camera.x += speed/camera.zoom*delta
	}

	if (keys["Equal"]) {
		camera.zoom += (0.01) * delta * camera.zoom * 60
	}
	if (keys["Minus"]) {
		camera.zoom -= (0.01) * delta * camera.zoom * 60
	}

	if (jKeys["KeyG"]) {
		camera.x = 0
		camera.y = 0
		camera.zoom = 1
	}

	if (jKeys["Space"]) {
		followBest = !followBest
	}
	if (jKeys["KeyR"]) {
		showRaycasts = !showRaycasts
	}

	if (followBest) {
		camera.x += (creatures[0].x-camera.x)*delta*5
		camera.y += (creatures[0].y-camera.y)*delta*5
	}

	// ctx.fillStyle = "white"
	// ctx.fillRect(mouse.x+canvas.width/2-5, mouse.y+canvas.height/2-5, 10, 10)

	ctx.fillStyle = "green"
	for (let i in food) {
		ctx.fillRect((food[i].x-2.5 - camera.x)*camera.zoom+canvas.width/2, (food[i].y-2.5 - camera.y)*camera.zoom+canvas.height/2, 5*camera.zoom, 5*camera.zoom)
	}

	for (let creature of creatures) {
		creature.displayX += (creature.x - creature.displayX) * delta * 5
		creature.displayY += (creature.y - creature.displayY) * delta * 5
		creature.displayRot = intAngle(creature.displayRot, creature.rot, delta*5)
		creature.draw(5)
	}

	ctx.fillStyle = "red"
	let dotSize = 50
	for (let dot of dots) {
		ctx.fillRect((dot.x-dotSize/2 - camera.x)*camera.zoo+canvas.width/2, (dot.y-dotSize/2 - camera.y)*camera.zoom+canvas.height/2, 5*camera.zoom, 5*camera.zoom)
	}

	let startTime = new Date().getTime()
	tickTime += delta
	while (tickTime > tickInt && new Date().getTime() - startTime < 1000/animFPS) {
		tickTime -= tickInt
		for (let i in food) {
			food[i].t -= 1
			if (food[i].t <= 0) {
				food.splice(i, 1)
				i--
			}
			for (let creature of creatures) {
				if (!food[i]) { continue }
				if (creature.herbivore && isColliding(creature.hitbox, {x: food[i].x, y: food[i].y, width: 5, height: 5})) {
					creature.food += Object.keys(creature.tiles).length
					creature.duplicate()
					food.splice(i, 1)
					i--
				}
			}
		}

		updateIndexes()
		creatureI = 0
		for (let creature of creatures) {
			// creature.mutate(3, 1, 3, 0.1)
			creature.tick()
			creature.netTick()
			let bounds = creature.getBounds()
			bounds.lx *= creature.size; bounds.ly *= creature.size; bounds.mx *= creature.size; bounds.my *= creature.size
			// if (creature.x+canvas.width/2 < -bounds.lx+creature.size/2) {
			// 	creature.x = -bounds.lx+creature.size/2 - canvas.width/2
			// }
			// if (creature.x+canvas.width/2 > canvas.width-bounds.mx-creature.size/2) {
			// 	creature.x = canvas.width-bounds.mx-creature.size/2 - canvas.width/2
			// }
			// if (creature.y+canvas.height/2 < -bounds.ly+creature.size/2) {
			// 	creature.y = -bounds.ly+creature.size/2-canvas.height/2
			// }
			// if (creature.y+canvas.height/2 > canvas.height-bounds.my-creature.size/2) {
			// 	creature.y = canvas.height-bounds.my-creature.size/2-canvas.height/2
			// }
			creatureI++
		}

		while (creatures.length < startCreatures && autoSpawn) {
			createCreature(creatures.length)
		}

		creatures.sort((a, b) => (b.moved - a.moved))

		fps += 1

		for (let i2 = 0; i2 < foodAmount; i2++) {
			food.push({t: 600, x: Math.random()*foodSpawnSize-foodSpawnSize/2, y: Math.random()*foodSpawnSize-foodSpawnSize/2})
		}
	}
	jKeys = {}
}

requestAnimationFrame(tick)

setInterval(() => {
	console.log("FPS: " + fps + " Target FPS: " + targetFPS + " Creatures: " + creatures.length + " Anim FPS: " + animFPS)
	fps = 0
	overflows = 0
	tickRate = 0
}, 1000)

var startI = 0
var overflows = 0
var tickRate = 0
var maxCompute = 1000
var currentTime = 0
var targetFPS = 0

var intervalId

function setFPS(frames) {
	targetFPS = frames
	tickInt = 1/frames
	// if (intervalId) {
	// 	clearInterval(intervalId)
	// }
	// intervalId = setInterval(() => {
	// 	dots = []
		
	// }, 1000/frames)
}

setFPS(20)

// setInterval(async () => {
// 	var startTime = new Date().getTime()
// 	currentTime = startTime

// 	for (let i2 = 0; i2 < 5; i2++) {
// 		food.push({t: 6, x: Math.random()*foodSpawnSize-foodSpawnSize/2, y: Math.random()*foodSpawnSize-foodSpawnSize/2})
// 	}
	
// 	let compute = 0
// 	let i = 0
// 	let stop = false
// 	for (let creature of creatures) {
// 		if (i < startI || stop) {
// 			continue
// 		}
// 		if (compute > maxCompute) {
// 			compute = 0
// 			await new Promise(resolve => setTimeout(resolve, 0))
// 		}

// 		creature.netTick()
		
// 		compute += creature.net.nodes.length
// 		i++

// 		if (currentTime != startTime) {
// 			startI = i
// 			overflows += 1
// 			stop = true
// 			return
// 		}
// 	}

// 	if (!stop) {
// 		startI = 0
// 		tickRate++
// 	}
	
// 	// netManager.postMessage({task: "netTick", creatures: creatures, food: food, time: time, canvas: {width: canvas.width, height: canvas.height}})
// }, 1000/10)

// netManager.onmessage = function(event) {
// 	let data = event.data
// 	let task = data.task
// 	if (task == "netTick") {
// 		let creatures2 = data.creatures
// 		creatures = []
// 		for (let i in creatures2) {
// 			creatures.push(new Creature(0, 0, 0))
// 			for (let prop in creatures2[i]) {
// 				creatures[i][prop] = creatures2[i][prop]
// 			}
// 			creatures[i].net = new Net(0, 0, 0, [0, 0])
// 			for (let prop in creatures2[i].net) {
// 				creatures[i].net[prop] = creatures2[i].net[prop]
// 			}
// 		}
// 	}
// }

// netManager.onerror = function(error) {
//   console.error('Worker error:', error)
// }

// setInterval(() => {
// 	for (let i in ais) {
// 		if (i >= ais.length/2) {
// 			ais[i].net.load(ais[Math.round(Math.random()*(ais.length/10))].net.save())
// 			ais[i].net.mutate(100, 50, 3, 5, 3, 5, 100, 25, 100, 25)
// 		}

// 		ais[i].net.load(ais[i].net.save())

// 		ais[i].x = spawn.x
// 		ais[i].y = spawn.y
// 		ais[i].vx = 0
// 		ais[i].vy = 0
// 		ais[i].d = 0
// 	}
// 	time = 0
// }, 10000)

function loadCreature(save, x, y) {
	var creature = new Creature(x, y, 5)
	creature.load(save)
	creatures.push(creature)
}

function angleDistance(angle1, angle2) {
	angle1 = (angle1 + Math.PI*2) % (Math.PI*2)
	angle2 = (angle2 + Math.PI*2) % (Math.PI*2)
	let angleDistance = ((angle2 - angle1 + (Math.PI*3))) % (Math.PI*2) - Math.PI
	return angleDistance
}

function intAngle(angle1, angle2, interpolate) {
	angle1 *= 180 / Math.PI
	angle2 *= 180 / Math.PI
	angle1 = (angle1 + 360) % 360
	angle2 = (angle2 + 360) % 360
	var angleDistance = ((angle2 - angle1 + 540) % 360) - 180
	var interpolatedAngle = angle1 + angleDistance * interpolate
	interpolatedAngle = (interpolatedAngle + 360) % 360
	return interpolatedAngle * (Math.PI/180)
}