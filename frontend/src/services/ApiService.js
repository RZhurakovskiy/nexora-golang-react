/**
 * Базовый класс для API сервисов
 * Общая логика для HTTP запросов
 */
class ApiService {
	constructor(baseURL = 'http://localhost:8080') {
		this.baseURL = baseURL
		this.progressCallback = null
	}

	setProgressCallback(callback) {
		this.progressCallback = callback
	}

	/**
	 * Выполняет HTTP запрос
	 * @param {string} endpoint - endpoint API
	 * @param {Object} options - опции запроса (method, body, headers)
	 * @returns {Promise<Object>}
	 */
	async request(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`
		const config = {
			method: options.method || 'GET',
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		}

		if (options.body) {
			config.body = JSON.stringify(options.body)
		}

		try {
			// Симуляция прогресса для API запросов
			if (this.progressCallback) {
				this.progressCallback(20)
			}

			const response = await fetch(url, config)

			if (this.progressCallback) {
				this.progressCallback(60)
			}

			const result = await response.json()

			if (this.progressCallback) {
				this.progressCallback(100)
			}

			if (!response.ok) {
				throw new Error(
					result.message || `HTTP error! status: ${response.status}`
				)
			}

			return result
		} catch (error) {
			console.error(`API Error [${endpoint}]:`, error)
			throw error
		}
	}

	/**
	 * GET
	 */
	async get(endpoint) {
		return this.request(endpoint, { method: 'GET' })
	}

	/**
	 * POST
	 */
	async post(endpoint, body) {
		return this.request(endpoint, { method: 'POST', body })
	}

	/**
	 * PUT
	 */
	async put(endpoint, body) {
		return this.request(endpoint, { method: 'PUT', body })
	}

	/**
	 * DELETE
	 */
	async delete(endpoint) {
		return this.request(endpoint, { method: 'DELETE' })
	}
}

export default ApiService
