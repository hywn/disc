/*
https://discord.com/developers/docs/topics/gateway#heartbeating
If a client does not receive a heartbeat ack between its attempts at sending heartbeats, it should immediately terminate the connection with a non-1000 close code, reconnect, and attempt to resume.
*/

const listen =
	sock => listeners => async () => {
		console.error(`==== Listening with ${listeners.length} listeners...`)

		for await (const msg of sock) {
			console.error(`<--- ${msg}`)

			if (typeof msg !== 'string') {
				console.error(msg)
				throw '^^^ expected string but got this (probably an error from Deno ws)'
			}

			const json = JSON.parse(msg)

			const before = listeners.length
			listeners = listeners.filter(listener => !listener(json))
			console.error(`==== Listeners: ${before} => ${listeners.length}`)
		}
	}

const send_json =
	sock => json =>
		sock.send(JSON.stringify(json))
			.then(() => console.error(`---> ${JSON.stringify(json)}`))

const kill =
	sock => listeners => () => {
		for (const listener of listeners)
			listener({ broadcast: 'closing' })

		return sock.close()
			.catch(console.error)
	}

const beaters =
	send_json => {
		let my_interval = null
		let my_s = null

		return [
			({ op, d }) => {
				if (op === 10) {
					my_interval = setInterval(() => send_json({ op: 1, d: my_s }), d.heartbeat_interval)

					return true
				}
			},

			({ s, broadcast }) => {
				if (broadcast === 'closing')
					clearInterval(my_interval)

				if (s)
					my_s = s
				}
		]
	}

const new_discorder =
	sock => listeners => {
		const self = {}

		self.send_json = send_json(sock)
		self.listen    = listen(sock)(listeners)
		self.kill      = kill(sock)(listeners)

		listeners.push(...beaters(self.send_json))

		return self
	}

export default new_discorder