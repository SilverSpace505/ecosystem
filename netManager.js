importScripts("data.js")
importScripts("net.js")
importScripts("sprites.js")

var canvas = {width: 0, height: 0}
var time = 0
var food = []
var creatures = []

self.onmessage = function(event) {
	let data = event.data
	let task = data.task
	if (task == "netTick") {
		creatures = data.creatures
		food = data.food
		time = data.time
		canvas = data.canvas
		for (let i in creatures) {
			let creature = new Creature(0, 0, 0)
			for (let prop in creatures[i]) {
				creature[prop] = creatures[i][prop]
			}
			creature.net = new Net(0, 0, 0, [0, 0])
			for (let prop in creatures[i].net) {
				creature.net[prop] = creatures[i].net[prop]
			}
			creature.netTick()
		}
		self.postMessage({task: "netTick", creatures: creatures})
	}
}