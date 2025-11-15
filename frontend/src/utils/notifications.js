/**
 * Утилиты для создания уведомлений
 * Упрощают создание уведомлений с предустановленными параметрами
 */

/**
 * Создает уведомление об успехе
 * @param {string} message - Сообщение
 * @param {string} title - Заголовок (опционально)
 * @param {number} duration - Длительность в мс (по умолчанию 3000)
 */
export const notifySuccess = (message, title = 'Успешно', duration = 3000) => ({
	type: 'success',
	title,
	message,
	duration,
})

/**
 * Создает уведомление об ошибке
 * @param {string} message - Сообщение
 * @param {string} title - Заголовок (опционально)
 * @param {number} duration - Длительность в мс (по умолчанию 5000)
 */
export const notifyError = (message, title = 'Ошибка', duration = 5000) => ({
	type: 'error',
	title,
	message,
	duration,
})

/**
 * Создает предупреждающее уведомление
 * @param {string} message - Сообщение
 * @param {string} title - Заголовок (опционально)
 * @param {number} duration - Длительность в мс (по умолчанию 4000)
 */
export const notifyWarning = (
	message,
	title = 'Предупреждение',
	duration = 4000
) => ({
	type: 'warning',
	title,
	message,
	duration,
})

/**
 * Создает информационное уведомление
 * @param {string} message - Сообщение
 * @param {string} title - Заголовок (опционально)
 * @param {number} duration - Длительность в мс (по умолчанию 4000)
 */
export const notifyInfo = (message, title = 'Информация', duration = 4000) => ({
	type: 'info',
	title,
	message,
	duration,
})
