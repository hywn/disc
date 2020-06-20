const base_rest_url = 'https://discord.com/api'

/* takes Authorization header value and returns
** a function that can be used to send stuff to the Discord API
*/
const new_sender =
	authorization => ({ url: relative_url, method, body }) => {
		const options = {
			body,
			method,
			headers: { authorization }
		}

		if (typeof body === 'object') {
			options.body = JSON.stringify(body)
			options.headers['content-type'] = 'application/json'
		}

		return fetch(base_rest_url + relative_url, options)
	}

export default new_sender