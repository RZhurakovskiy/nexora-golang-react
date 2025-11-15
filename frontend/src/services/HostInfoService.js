import ApiService from './ApiService'

/**
 * Сервис для работы с информацией о хосте и пользователе
 */
class HostInfoService extends ApiService {
	/**
	 * Получает информацию о хосте и пользователе
	 * @returns {Promise<{username: string, hostname: string}>}
	 */
	async getHostUsername() {
		return this.get('/api/get-host-username')
	}

	/**
	 * Получает информацию о названии процессора и количестве ядер
	 * @returns {Promise<{processname: string, cores: number}>}
	 */
	async getDeviceInfo() {
		return this.get('/api/get-device-info')
	}
}

export default new HostInfoService()
