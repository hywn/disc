import base_new_discorder from './sock.js'

// manages heartbeat
const beaters =
	() => {
		let my_interval = null
		let my_s        = null

		return [
			({ send_json }) => ({ op, d }) => {
				if (op !== 10)
					return

				my_interval = setInterval(() => send_json({ op: 1, d: my_s }), d.heartbeat_interval)

				return true
			},
			() => ({ s, broadcast }) => {
				if (s)
					my_s = s
				if (broadcast === 'closing')
					clearInterval(my_interval)
			}
		]
	}

const new_discorder =
	sock => (...self_listeners) => (...listeners) =>
		base_new_discorder(sock)(...beaters(), ...self_listeners)(...listeners)

export default new_discorder