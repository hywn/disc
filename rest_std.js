import new_sender from './rest.js'

/***********************************************/
/** some of the Discord API, but as functions **/
/** exported through std_sender               **/
/***********************************************/
const std = {
	create_message: s => channel_id => (content, options) => s({
		url: `/channels/${channel_id}/messages`,
		method: 'POST',
		body: {
			content,
			...options
		}
	}),
	create_reaction: s => channel_id => message_id => emoji => s({
		url: `/channels/${channel_id}/messages/${message_id}/reactions/${encodeURIComponent(emoji)}/@me`,
		method: 'PUT'
	})
}

/// <-- authorization header value
/// --> std but everything bound to new_sender(authorization header value)
const std_sender =
	auth => {
		const sender = new_sender(auth)

		return Object.fromEntries(
			Object.entries(std)
				.map(([k, v]) => [k, v(sender)])
		)
	}

export default std_sender