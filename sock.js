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

const new_discorder =
	sock => (...self_listeners) => (...listeners) => {
		const self = {}
		const ls = []

		self.send_json = send_json(sock)
		self.listen    = listen(sock)(ls)
		self.kill      = kill(sock)(ls)

		ls.push(...self_listeners.map(l => l(self)))
		ls.push(...listeners)

		return self
	}

export default new_discorder