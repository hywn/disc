import base_new_discorder from './sock.js'

const new_dispatch_listener =
	event_name => listener =>
		json => {
			if (json.op === 0 && json.t === event_name)
				listener(json)
		}

/********************************************/
/** augmented discorder                    **/
/** can handle frequently-used things like **/
/** heartbeat and authentication           **/
/********************************************/

// Heart: heartbeat manager (https://discord.com/developers/docs/topics/gateway#heartbeating)
// TODO: 'If a client does not receive a heartbeat ack between its attempts at sending heartbeats, it should immediately terminate the connection with a non-1000 close code, reconnect, and attempt to resume.'
class Heart {
	constructor() {
		this.interval = null
		this.s        = null

		// self-listener that sets up loop that sends this.s to server
		this.interval_setter = ({ send_json }) => ({ op, d }) => {
			if (op !== 10)
				return

			this.interval = setInterval(() => send_json({ op: 1, d: this.s }), d.heartbeat_interval)

			return true
		}

		// listener that updates this.s
		this.beater = ({ s, broadcast }) => {
			if (s)
				this.s = s
			if (broadcast === 'closing')
				clearInterval(this.interval)
		}
	}
}

const new_discorder =
	sock => (...self_listeners) => (...listeners) => {
		const heart = new Heart()

		const d = base_new_discorder
			(sock)
			(heart.interval_setter, ...self_listeners)
			(heart.beater, ...listeners)

		d.auth =
			token => intents =>
				d.send_json({ op: 2, d: { token, intents, properties: {} } })

		return d
	}

/*************/
/** exports **/
/*************/

export { new_discorder, new_dispatch_listener }