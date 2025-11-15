import ApiService from './ApiService'

/**
 * Сервис для работы с процессами
 */
class ProcessService extends ApiService {
	/**
	 * Завершает процесс по PID
	 * @param {number} pid - ID процесса
	 * @returns {Promise<{message: string}>}
	 */
	async killProcessById(pid) {
		if (pid <= 0) {
			throw new Error('Некорректный PID')
		}
		return this.post('/api/kill-process-by-id', { pid })
	}
}

export default new ProcessService()
