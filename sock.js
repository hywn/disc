const send_json =
	({ sock }) => json =>
		sock.send(JSON.stringify(json))
			.then(() => console.error('sent: ', json))

// sit and wait until we receive op
const wait_for =
	({ jsoner }) => async op => {

		console.error(`waiting for op=${op}...`)

		for await (const json of jsoner) {
			console.error(`received ${JSON.stringify(json)}`)
			console.error(json)
			if (json.op == op)
				return json
		}

		console.log("OH NO! NOTHING!!")
	}

// did you know generators can only be iterated once
const listen =
	({ jsoner }) => async (...listeners) => {

		console.error(`Listening with ${listeners.length} listeners...`)

		for await (const json of jsoner) {
			console.error(`received ${JSON.stringify(json)}`)
			console.log(json)
			listeners.forEach(listener => listener(json))
		}

	}

const kill =
	self => async () => {
		clearInterval(self.heartbeat_interval)

		await self.sock.close().catch(console.error)
	}

// wraps a sock and returns its readings but parsed to JSON
const make_jsoner =
	sock => ({
		async* [Symbol.asyncIterator]() {
			for await(const msg of sock) {
				console.log(`jsoner got raw string: ${msg}`)
				if (typeof msg !== 'string') {
					console.log(msg)
					throw '^^^ expected string but got this (probably an error from Deno ws)'
				}
				yield JSON.parse(msg)
			}
		}
	})

// idk what discord thinks of null
// even if you send it null when it gave you s: number last message
// it doesn't really mind???
// discord occasionally sends back { op: 11, s: null, ... }
// which makes heartbeat send { op: 1, d: null } sometimes
// but Discord doesn't mind I guess bc it knows that it sent you null ?
const Listener_update_s =
	self => json => {
		self.s = json.s
		console.log(`updated s: ${self.s}`)
	}

const new_discorder =
	async sock => {

		const self = { sock, s: null }

		self.jsoner = make_jsoner(sock)

		self.send_json = send_json(self)
		self.wait_for  = wait_for(self)
		self.listen    = (...listeners) => listen(self)(...listeners, Listener_update_s(self))
		self.kill      = kill(self)

		const { d: { heartbeat_interval } } = await self.wait_for(10)

		self.heartbeat_interval = setInterval(() => self.send_json({ op: 1, d: self.s }), heartbeat_interval)

		return self

	}

export default new_discorder