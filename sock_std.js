import base_new_discorder from './sock.js'

/// <-- event name
/// <-- f
/// --> a listener that calls f(json) if json.op === 0 and json.t === event name
const new_dispatch_listener =
	event_name => listener =>
		json => {
			if (json.op === 0 && json.t === event_name)
				listener(json)
		}

// Heart: heartbeat manager (https://discord.com/developers/docs/topics/gateway#heartbeating)
// TODO: 'If a client does not receive a heartbeat ack between its attempts at sending heartbeats, it should immediately terminate the connection with a non-1000 close code, reconnect, and attempt to resume.'
/// <-- object containing a socket-bound send_json function
/// --> [two listeners that manage gateway heartbeat]
const new_heart =
	({ send_json }) => {
		let my_interval = null
		let my_s        = null

		const interval_setter = ({ op, d }) => {
			if (op !== 10)
				return

			my_interval = setInterval(() => send_json({ op: 1, d: my_s }), d.heartbeat_interval)

			return true
		}

		const beater = ({ s, broadcast }) => {
			if (s)
				my_s = s
			if (broadcast === 'closing')
				clearInterval(my_interval)
		}

		return [interval_setter, beater]
	}

/// <-- auth token to send to Discord gateway API
/// <-- intents to send to Discord gateway API
/// ==> { send_json, kill, listen } but with auth and heartbeat preinstalled
const std_discorder =
	token => async intents => {

		const d = await base_new_discorder()

		// attach heart
		const old_listen = d.listen
		d.listen = (...listeners) => old_listen(...new_heart(d), ...listeners)

		// send auth
		d.send_json({ op: 2, d: { token, intents, properties: {} } })

		return d
	}

export default std_discorder
export { new_heart, new_dispatch_listener }