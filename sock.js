const send_json =
	({ sock }) => json =>
		sock.send(JSON.stringify(json))
			.then(() => console.error(`---> ${JSON.stringify(json)}`))

/*
https://discord.com/developers/docs/topics/gateway#heartbeating
If a client does not receive a heartbeat ack between its attempts at sending heartbeats, it should immediately terminate the connection with a non-1000 close code, reconnect, and attempt to resume.
*/

// did you know generators can only be iterated once
const listen =
	({ jsoner, listeners }) => async (...listeners) => {

		console.error(`Listening with ${listeners.length} listeners...`)

		for await (const json of jsoner) {

			const before = listeners.length

			listeners = listeners.filter(listener => !listener(json))

			console.error(`LSN: ${before} => ${listeners.length}`)

		}

	}

const kill =
	self => () => {
		clearInterval(self.heartbeat_interval)

		return self.sock.close()
			.catch(console.error)
	}

// wraps a sock and returns its readings but parsed to JSON
const make_jsoner =
	sock => ({
		async* [Symbol.asyncIterator]() {
			for await(const msg of sock) {
				console.error(`<--- ${msg.toString()}`)

				if (typeof msg !== 'string') {
					console.log(msg)
					throw '^^^ expected string but got this (probably an error from Deno ws)'
				}

				yield JSON.parse(msg)
			}
		}
	})

const beaters =
	self => {
		let my_s = null

		return [
			({ op, d }) => {
				if (op === 10) {
					setInterval(() => self.send_json({ op: 1, d: my_s }), d.heartbeat_interval)

					return true
				}
			},

			({ s }) => { if (s) my_s = s }
		]
	}

const new_discorder =
	async sock => {
		const self = { sock, s: null }

		self.jsoner = make_jsoner(sock)

		self.send_json = send_json(self)
		self.listen    = (...listeners) => listen(self)(...listeners, ...beaters(self))
		self.kill      = kill(self)

		return self
	}

export default new_discorder