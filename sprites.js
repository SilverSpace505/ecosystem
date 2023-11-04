
class Object2D {
	x = 0
	y = 0
	width = 0
	height = 0
	constructor(x, y, width, height) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}
	isColliding(obj) {
		return (
			this.x+this.width/2 > obj.x-obj.width/2 && this.x-this.width/2 < obj.x+obj.width/2 &&
			this.y+this.height/2 > obj.y-obj.height/2 && this.y-this.height/2 < obj.y+obj.height/2
		)
	}
	intersects(rx, ry, rdx, rdy) {
		let dx = this.x-rx
		let dy = this.y-ry
		return (dx**2 + dy**2) - (dx * rdx + dy * rdy)**2 < (this.width/2) ** 2 + (this.height/2) ** 2
	}
}

function isColliding(obj1, obj2) {
	return (
		obj1.x+obj1.width/2 > obj2.x-obj2.width/2 && obj1.x-obj1.width/2 < obj2.x+obj2.width/2 &&
		obj1.y+obj1.height/2 > obj2.y-obj2.height/2 && obj1.y-obj1.height/2 < obj2.y+obj2.height/2
	)
}

function rayIntersects(rx, ry, rdx, rdy, obj) {
	const tMinX = (obj.x - obj.width / 2 - rx) / rdx
	const tMaxX = (obj.x + obj.width / 2 - rx) / rdx

	const tMinY = (obj.y - obj.height / 2 - ry) / rdy
	const tMaxY = (obj.y + obj.height / 2 - ry) / rdy

	const tEnter = Math.max(Math.min(tMinX, tMaxX), Math.min(tMinY, tMaxY))
	const tExit = Math.min(Math.max(tMinX, tMaxX), Math.max(tMinY, tMaxY))

	return tEnter < tExit && tExit >= 0
}

class Creature {
	tiles = {}
	net
	size = 0
	x = 0
	y = 0
	displayX = 0
	displayY = 0
	displayRot = 0
	rot = 0
	hitbox = {}
	food = 0
	i = 0
	inputs = []
	output = []
	herbivore = false
	carnivore = false
	god = 1
	changed = true
	setup = false
	moved = 0
	constructor(x, y, size) {
		this.x = x
		this.y = y
		this.displayX = x
		this.displayY = y
		this.size = size
		this.setTile(0, 0, "brain")
		this.net = new Net(0, 0, [0, 100], [0, 100])
	}
	isColliding(obj) {
		let hitbox = this.getHitbox()
		return (
			hitbox.x+hitbox.width/2 > obj.x-obj.width/2 && hitbox.x-hitbox.width/2 < obj.x+obj.width/2 &&
			hitbox.y+hitbox.height/2 > obj.y-obj.height/2 && hitbox.y-hitbox.height/2 < obj.y+obj.height/2
		)
	}
	getHitbox() {
		let bounds = this.getBounds()
		bounds.lx *= this.size; bounds.ly *= this.size; bounds.mx *= this.size; bounds.my *= this.size
		let bounds2 = {lx: this.x+bounds.lx, mx: this.x+bounds.mx, ly: this.y+bounds.ly, my: this.y+bounds.my}
		return {x: (bounds2.lx+bounds2.mx)/2, y: (bounds2.ly+bounds2.my)/2, width: bounds.mx-bounds.lx, height: bounds.my-bounds.ly}
	}
	setTile(x, y, tile) {
		this.changed = true
		this.tiles[x+","+y] = [tile, []]
		for (let i = 0; i < tileData[tile].input; i++) {
			this.tiles[x+","+y][1].push(0)
		}
	}
	removeTile(x, y) {
		this.changed = true
		delete this.tiles[x+","+y]
	}
	getTile(x, y) {
		return this.tiles[x+","+y]
	}
	getBounds() {
		let lx = 0
		let mx = 0
		let ly = 0
		let my = 0
		for (let coords in this.tiles) {
			let coords2 = coords.split(",")
			let x = parseInt(coords2[0])
			let y = parseInt(coords2[1])
			if (x < lx) {
				lx = x
			}
			if (x > mx) {
				mx = x
			}
			if (y < ly) {
				ly = y
			}
			if (y > my) {
				my = y
			}
		}
		return {lx:lx, mx:mx, ly:ly, my:my}
	}
	getInputs() {
		let amount = 0
		for (let coords in this.tiles) {
			let tile = this.tiles[coords][0]
			amount += tileData[tile].input
		}
		return amount
	}
	getOutputs() {
		let amount = 0
		for (let coords in this.tiles) {
			let tile = this.tiles[coords][0]
			amount += tileData[tile].output
		}
		return amount
	}
	getInputValues() {
		let input = [1, this.food/5]
		for (let coords in this.tiles) {
			let tile = this.tiles[coords]

			if (tile[0] == "locator") {
				tile[1][0] = this.x / foodSpawnSize
				tile[1][1] = this.y / foodSpawnSize
			}
			if (tile[0] == "timer") {
				tile[1][0] = time
			}
			if (tile[0] == "gyro") {
				tile[1][0] = this.rot
			}
			if (tile[0] == "user") {
				tile[1][0] = mouse.x / foodSpawnSize
				tile[1][1] = mouse.y / foodSpawnSize
			}
			if (tile[0] == "eye") {
				let coords2 = coords.split(",")
				let x2 = coords2[0]
				let y2 = coords2[1]
				
				let x = x2 * Math.cos(this.rot) - y2 * Math.sin(this.rot)
				let y = x2 * Math.sin(this.rot) + y2 * Math.cos(this.rot)
				
				let dir = {x: x, y: y}
				let length = Math.sqrt(dir.x**2 + dir.y**2)
				dir.x /= length; dir.y /= length

				
				let ray = {x: x*this.size+this.x, y: y*this.size+this.y, width: this.size, height: this.size}
				let found = false

				let close = []
				let d = 0
				for (let i in food) {
					d = Math.sqrt((food[i].x-ray.x)**2+(food[i].y-ray.y)**2)
					if (d < 100) {
						close.push({x: food[i].x, y: food[i].y, width: 5, height: 5, type: 0, d: d})
					}
				}
				for (let i in creatures) {
					if (this.i == creatures[i].i) { continue }
					if (creatures[i].god > 0) { continue }
					d = Math.sqrt((creatures[i].x-ray.x)**2+(creatures[i].y-ray.y)**2)
					if (d < 100) {
						close.push(creatures[i].hitbox)
						close[close.length-1].type = 1
						close[close.length-1].d = d
					}
				}

				// close.sort((a, b) => (b.d - a.d))

				tile[1][0] = 100

				let doBreak = false
				for (let i in close) {
					if (rayIntersects(ray.x, ray.y, dir.x, dir.y, close[i])) {
						dots.push({x: close[i].x, y: close[i].y})
						tile[1][0] = close[i].d
						tile[1][1] = close[i].type
						doBreak = true
					}
					if (doBreak) { break }
				}

				// while (!found && Math.sqrt((ray.x-this.x-x*this.size)**2 + (ray.y-this.y-y*this.size)**2) < 100) {
				// 	ray.x += dir.x*2
				// 	ray.y += dir.y*2

				// 	for (let i in close) {
				// 		if (found) { continue }
				// 		if (isColliding(ray, close[i])) {
				// 			found = true
				// 			tile[1][1] = close[i].type
				// 		}
				// 	}
					
				// 	// for (let i in food) {
				// 	// 	if (found) { continue }
				// 	// 	if (isColliding(ray, {x: food[i].x, y: food[i].y, width: 5, height: 5})) {
				// 	// 		found = true
				// 	// 		tile[1][1] = 0
				// 	// 	}
				// 	// }
				// 	// for (let i in creatures) {
				// 	// 	if (found) { continue }
				// 	// 	if (this.i == creatures[i].i) { continue }
				// 	// 	if (creatures[i].god > 0) { continue }
				// 	// 	if (isColliding(ray, creatures[i].hitbox)) {
				// 	// 		found = true
				// 	// 		tile[1][1] = 1
				// 	// 	}
				// 	// }
				// }
				// tile[1][0] = Math.sqrt((ray.x-this.x-x*this.size)**2 + (ray.y-this.y-y*this.size)**2)
			}

			input.push(...tile[1])
		}
		return input
	}
	checkCollapse(x, y, length) {
		if (!this.getTile(x, y)) { return }
		let steps = 0
		let covered = []
		let offs = [
			[-1, 0],
			[1, 0],
			[0, 1],
			[0, -1]
		]
		covered.push(x+","+y)
		let lastAmount = -1
		let amount = 0
		while (!covered.includes("0,0") && steps <= length && lastAmount != amount) {
			lastAmount = amount
			let toAdd = []
			for (let coords of covered) {
				let coords2 = coords.split(",")
				let x = parseInt(coords2[0])
				let y = parseInt(coords2[1])
				for (let off of offs) {
					if (this.getTile(x+off[0], y+off[1])) {
						toAdd.push((x+off[0])+","+(y+off[1]))
						amount++
					}
				}
			}
			covered.push(...toAdd)
			steps += 1
		}
		if (steps > length || lastAmount == amount) {
			this.removeTile(x, y)
		}
	}
	duplicate() {
		if (creatures.length >= maxCreatures) { return }
		let newCreature = new Creature(this.x, this.y, 5)
		newCreature.rot = this.rot + Math.random()*Math.PI/4 - Math.PI/8
		newCreature.tiles = JSON.parse(JSON.stringify(this.tiles))
		newCreature.mutate(3, 10, 3, 10)
		newCreature.net.copy(this.net)
		newCreature.setupNet()
		newCreature.net.mutate(10, 30, 3, 1, 3, 1, 5, 5, 5, 5)
		newCreature.food = Object.keys(newCreature.tiles).length * 100
		creatures.push(newCreature)
	}
	setupNet() {
		this.net.setInputNodes(this.getInputs()+2)
		this.net.setOutputNodes(this.getOutputs())
		this.net.setNodes([0, this.tiles.length])
	}
	netTick() {
		this.setupNet()

		this.input = this.getInputValues()
		this.net.setInput(this.input)

		this.net.tick()

		this.output = this.net.output()
	}
	tick() {

		if (!this.setup) {
			this.setup = true
			this.netTick()
		}

		if (this.changed) {
			this.changed = false
			for (let coords in this.tiles) {
				if (coords == "0,0") { continue }
				let coords2 = coords.split(",")
				let x = parseInt(coords2[0])
				let y = parseInt(coords2[1])
				this.checkCollapse(x, y, 3)
			}
		}

		this.food -= 3
		this.god -= 1

		if (this.food <= 0) {
			creatures.splice(this.i, 1)
			creatureI -= 1
			updateIndexes()
		}

		let output = this.output

		// this.net.mutate(100, 1, 3, 0.01, 3, 0.01, 100, 0.5, 100, 0.5)

		this.herbivore = false
		this.carnivore = false
		let speed = 5
		let outputI = 0
		let old = {x:this.x, y:this.y}
		for (let coords in this.tiles) {
			let coords2 = coords.split(",")
			let x = parseInt(coords2[0])
			let y = parseInt(coords2[1])
			let tile = this.getTile(x, y)[0]
			if (tile == "mover") {
				this.x += output[outputI] * Math.cos(this.rot) * speed - output[outputI+1] * Math.sin(this.rot) * speed
				this.y += output[outputI] * Math.sin(this.rot) * speed + output[outputI+1] * Math.cos(this.rot) * speed
				this.food -= 1
			}
			if (tile == "rotator") {
				this.rot += output[outputI] * Math.PI
				this.food -= 1
			}
			if (tile == "eater" && output[outputI] > 0) {
				this.herbivore = true
			}
			if (tile == "killer" && this.god <= 0 && output[outputI] > 0) {
				this.carnivore = true
				this.kill()
			}

			outputI += tileData[tile].output
		}
		this.moved += Math.sqrt((this.x-old.x)**2 + (this.y-old.y)**2)
		this.hitbox = this.getHitbox()
		// this.rot += 0.01
	}
	kill() {
		for (let creature of creatures) {
			if (creature.i == this.i) { continue }
			if (isColliding(this.hitbox, creature.hitbox)) {
				if (creature.god <= 0) {
					creatures.splice(creature.i, 1)
					if (creature.i > creatureI) {
						creatureI -= 1
					}
					updateIndexes()
					this.duplicate()
					this.food += Object.keys(this.tiles).length
				} else {
					creature.god = 1
				}
			}
		}
	}
	mutate(setTiles, setTileC, removeTiles, removeTileC) {
		for (let i = 0; i < setTiles; i++) {
			if (Math.random()*100 > setTileC) { continue }
			let bounds = this.getBounds()
			bounds.lx -= 1; bounds.ly -= 1; bounds.mx += 1; bounds.my += 1;
			let x = Math.round(Math.random()*(bounds.mx-bounds.lx)+bounds.lx)
			let y = Math.round(Math.random()*(bounds.my-bounds.ly)+bounds.ly)
			if (x == 0 && y == 0) { continue }
			this.setTile(x, y, Object.keys(tileData)[Math.round(Math.random()*(Object.keys(tileData).length-2)+1)])
			this.checkCollapse(x, y)
		}
		for (let i = 0; i < removeTiles; i++) {
			if (Math.random()*100 > removeTileC) { continue }
			let coords = Object.keys(this.tiles)[Math.round(Math.random()*(Object.keys(this.tiles).length-1))].split(",")
			let x = parseInt(coords[0])
			let y = parseInt(coords[1])
			if (x == 0 && y == 0) { continue }
			this.removeTile(x, y)
		}
	}
	draw() {
		this.size *= camera.zoom
		ctx.translate((this.displayX-camera.x)*camera.zoom+canvas.width/2, (this.displayY-camera.y)*camera.zoom+canvas.height/2)
		ctx.rotate(this.displayRot)
		for (let coords in this.tiles) {
			let coords2 = coords.split(",")
			let x = parseInt(coords2[0])
			let y = parseInt(coords2[1])
			let tile = this.getTile(x, y)[0]
			ctx.fillStyle = tileData[tile].colour

			// let rx = x*Math.cos(this.rot) - y*Math.sin(this.rot)
			// let ry = x*Math.sin(this.rot) + y*Math.cos(this.rot)
			
			ctx.fillRect(x*this.size - this.size/2, y*this.size - this.size/2, this.size, this.size)

			if (tile == "eye" && showRaycasts) {
				ctx.setTransform(1, 0, 0, 1, 0, 0)
				ctx.translate((this.displayX-camera.x)*camera.zoom+canvas.width/2, (this.displayY-camera.y)*camera.zoom+canvas.height/2)

				let x2 = x * Math.cos(this.displayRot) - y * Math.sin(this.displayRot)
				let y2 = x * Math.sin(this.displayRot) + y * Math.cos(this.displayRot)
				
				let dir = {x: x2, y: y2}

				// dir.x = x * Math.cos(this.rot) - y * Math.sin(this.rot)
				// dir.y = x * Math.sin(this.rot) + y * Math.cos(this.rot)
				
				let length = Math.sqrt((dir.x**2) + (dir.y**2))
				dir.x /= length; dir.y /= length
				ctx.beginPath()
				ctx.moveTo(x2*this.size, y2*this.size)
				ctx.lineTo(x2*this.size + dir.x*this.getTile(x, y)[1][0]*camera.zoom, y2*this.size + dir.y*this.getTile(x, y)[1][0]*camera.zoom)
				ctx.strokeStyle = "white"
				ctx.lineWidth = 1*camera.zoom
				ctx.stroke()
				ctx.rotate(this.displayRot)
			}
		}
		ctx.setTransform(1, 0, 0, 1, 0, 0)
		this.size /= camera.zoom
	}
	save() {
		return this.net.save() + "|" + JSON.stringify(this.tiles)
	}
	load(save) {
		let split = save.split("|")
		this.net.load(split[0])
		this.tiles = JSON.parse(split[1])
	}
}