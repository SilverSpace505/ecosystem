
class Net {
	nodes = []
	inputs = 0
	outputs = 0
	connections = [0, 3]
	nodeAmount = [0, 5]
	constructor(inputs, outputs, nodes=[0, 5], connections=[0, 3]) {
		this.inputs = inputs
		this.outputs = outputs
		this.connections = connections
		this.nodeAmount = nodes

		let nodeAmount = Math.round(Math.random()*(nodes[1]-nodes[0]))+nodes[0]
		
		for (let i = 0; i < inputs+outputs+nodeAmount; i++) {
			this.nodes.push([0, []])
		}

		for (let i = 0; i < this.nodes.length; i++) {
			let amount = Math.round(Math.random()*(connections[1]-connections[0])+connections[0])
			for (let i2 = 0; i2 < amount; i2++) {
				this.nodes[i][1].push([Math.round(Math.random()*(this.nodes.length-1)), Math.round((Math.random()-0.5)*2*4*100)/100])
			}
		}
	}
	tick() {		
		let values = []
		for (let i in this.nodes) { values.push(0) }
		for (let i in this.nodes) {
			for (let i2 in this.nodes[i][1]) {
				values[this.nodes[i][1][i2][0]] += this.nodes[i][0] * this.nodes[i][1][i2][1]
			} 
		}

		for (let i in values) {
			this.nodes[i][0] = Math.round(Math.tanh(values[i])*100)/100
		}
	}
	setInput(inputs) {
		if (inputs.length <= 0 || inputs.length > this.inputs) { return }
		for (let i in inputs) {
			this.nodes[i][0] = inputs[i]
		}
	}
	output() {
		let output = []
		
		if (this.outputs <= 0) { return output }
		for (let i = this.nodes.length-this.outputs; i < this.nodes.length; i++) {
			output.push(this.nodes[i][0])
		}
		return output
	}
	mutate(weights, weightC, adds, addC, removes, removeC, addCons, addConC, removeCons, removeConC) {
		for (let i = 0; i < weights; i++) {
			if (Math.random()*100 > weightC) { continue }
			if (this.nodes.length <= 0) { continue }
			let i = Math.round(Math.random() * (this.nodes.length-1))
			if (this.nodes[i][1].length <= 0) { continue }
			let i2 = Math.round(Math.random() * (this.nodes[i][1].length-1))
			this.nodes[i][1][i2][1] += (Math.random()-0.5)*2*4
			this.nodes[i][1][i2][1] = Math.round(this.nodes[i][1][i2][1]*100)/100
			if (this.nodes[i][1][i2][1] > 4) { this.nodes[i][1][i2][1] = 4 }
			if (this.nodes[i][1][i2][1] < -4) { this.nodes[i][1][i2][1] = -4 }
		}
		for (let i = 0; i < adds; i++) {
			if (Math.random()*100 > addC) { continue }
			if (this.nodes.length-this.inputs-this.outputs >= this.nodeAmount[1]) { continue }
			this.addNode()
		}
		for (let i = 0; i < removes; i++) {
			if (Math.random()*100 > removeC) { continue }
			if (this.nodes.length <= this.inputs+this.outputs+this.nodeAmount[0]) { continue }
			this.removeNode(Math.round(Math.random()*(this.nodes.length-1-this.inputs-this.outputs))+this.inputs)
		}
		for (let i = 0; i < addCons; i++) {
			if (Math.random()*100 > addConC) { continue }
			if (this.nodes.length <= 0) { continue }
			let i = Math.round(Math.random() * (this.nodes.length-1))
			if (this.nodes[i][1].length >= this.connections[1]) { continue }
			this.nodes[i][1].push([Math.round(Math.random()*(this.nodes.length-1)), Math.round((Math.random()-0.5)*2*4*100)/100])
		}
		for (let i = 0; i < removeCons; i++) {
			if (Math.random()*100 > removeConC) { continue }
			if (this.nodes.length <= 0) { continue }
			let i = Math.round(Math.random() * (this.nodes.length-1))
			if (this.nodes[i][1].length <= 0) { continue }
			let i2 = Math.round(Math.random() * (this.nodes[i][1].length-1))
			this.nodes[i][1].splice(i2, 1)
		}
	}
	addNode() {
		let i = this.nodes.length-this.outputs
		this.nodes.splice(i, 0, [0, []])
		let amount = Math.round(Math.random()*(this.connections[1]-this.connections[0])+this.connections[0])
		for (let i2 = 0; i2 < amount; i2++) {
			this.nodes[i][1].push([Math.round(Math.random()*(this.nodes.length-1)), Math.round((Math.random()-0.5)*2*4*100)/100])
		}
	}
	removeNode(i) {
		for (let i2 in this.nodes) {
			for (let i3 = 0; i3 < this.nodes[i2][1].length; i3++) {
				if (this.nodes[i2][1][i3][0] == i) {
					this.nodes[i2][1].splice(i3, 1)
					i3--
				} else if (this.nodes[i2][1][i3][0] > i) {
					this.nodes[i2][1][i3][0] -= 1
				}
			}
		}
		this.nodes.splice(i, 1)
	}
	save(copyValues=false) {
		
		// let oldNodes = JSON.stringify({"a": this.nodes})

		// if (!copyValues) {
		// 	for (let i in this.nodes) {
		// 		this.nodes[i][0] = 0
		// 	}
		// }
		
		let text = JSON.stringify({"a": this.nodes})

		// this.nodes = JSON.parse(oldNodes).a
		
		return text.substring(5, text.length-1)+"_"+this.inputs+"_"+this.outputs+"_"+this.nodeAmount.join(",")
	}
	load(text) {
		let split = text.split("_")
		let text2 = '{"a":'+split[0]+"}"
		this.nodes = JSON.parse(text2).a

		this.inputs = parseInt(split[1])
		this.outputs = parseInt(split[2])
		this.nodeAmount = split[3].split(",")
		this.nodeAmount = [parseInt(this.nodeAmount[0]), parseInt(this.nodeAmount[1])]

		for (let node of this.nodes) {
			node[0] = 0
		}
	}
	copy(net) {
		this.load(net.save())
		this.nodeAmount = [...net.nodeAmount]
	}
	setInputNodes(inputs) {
		while (this.inputs < inputs) {
			let i = this.inputs
			this.nodes.splice(i, 0, [0, []])
			let amount = Math.round(Math.random()*(this.connections[1]-this.connections[0])+this.connections[0])
			for (let i2 = 0; i2 < amount; i2++) {
				this.nodes[i][1].push([Math.round(Math.random()*(this.nodes.length-1)), Math.round((Math.random()-0.5)*2*4*100)/100])
			}
			this.inputs += 1
		}

		while (this.inputs > inputs) {
			this.removeNode(0)
			this.inputs -= 1
		}
	}
	setOutputNodes(outputs) {
		while (this.outputs < outputs) {
			let i = this.nodes.length
			this.nodes.push([0, []])
			let amount = Math.round(Math.random()*(this.connections[1]-this.connections[0])+this.connections[0])
			for (let i2 = 0; i2 < amount; i2++) {
				this.nodes[i][1].push([Math.round(Math.random()*(this.nodes.length-1)), Math.round((Math.random()-0.5)*2*4*100)/100])
			}
			this.outputs += 1
		}

		while (this.outputs > outputs) {
			this.removeNode(this.nodes.length-1)
			this.outputs -= 1
		}
	}
	setNodes(nodes) {
		while (this.nodes.length > nodes) {
			this.removeNode(Math.round(Math.random()*(this.nodes.length-1-this.inputs-this.outputs))+this.inputs)
		}
		this.nodeAmount = nodes
	}
}