import { connectWebSocket } from 'https://deno.land/std/ws/mod.ts'

const gateway_url = 'wss://gateway.discord.gg/'

/// <-- socket
/// <-- list of listeners
/// === listens to socket, passing received json to each listener
const listen =
	sock => async listeners => {
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

/// <-- socket
/// <-- json
/// === sends json over socket
const send_json =
	sock => json =>
		sock.send(JSON.stringify(json))
			.then(() => console.error(`---> ${JSON.stringify(json)}`))

/// <-- socket
/// === kills the socket
const kill =
	sock => () =>
		sock.close()
			.catch(console.error)

/// ==> { send_json, kill, listen } all bound to a socket opened with Discord gateway API
const new_discorder =
	async () => {
		const self = {}
		const sock = await connectWebSocket(gateway_url)

		self.send_json = send_json(sock)
		self.kill      = kill(sock)
		self.listen    = (...listeners) => {
			self.kill = () => {
				for (const listener of listeners)
					listener({ broadcast: 'closing' })

				return kill(sock)()
			}

			return listen(sock)(listeners)
		}

		return self
	}

export default new_discorder