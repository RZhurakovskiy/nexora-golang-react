import { useEffect, useMemo } from 'react'
import './ProcessDetailsModal.css'

const ProcessDetailsModal = ({
	process,
	isOpen,
	onClose,
	getCpuPercent,
	getMemoryMb,
}) => {
	useEffect(() => {
		if (!isOpen) return
		const handleKeyDown = event => {
			if (event.key === 'Escape') {
				onClose()
			}
		}
		document.body.style.overflow = 'hidden'
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.body.style.overflow = ''
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen, onClose])

	const cpuPercent = useMemo(() => {
		if (!process) return 0
		return getCpuPercent ? getCpuPercent(process) : 0
	}, [process, getCpuPercent])

	const memoryMb = useMemo(() => {
		if (!process) return 0
		return getMemoryMb ? getMemoryMb(process) : 0
	}, [process, getMemoryMb])

	if (!isOpen || !process) {
		return null
	}

	const formatDate = timestamp => {
		if (!timestamp) return '—'
		try {
			const ts = Number(timestamp)
			if (Number.isNaN(ts)) return '—'
			const date = new Date(ts < 1e12 ? ts * 1000 : ts)
			if (Number.isNaN(date.getTime())) return '—'
			return date.toLocaleString('ru-RU', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
			})
		} catch (error) {
			return '—'
		}
	}

	const formatMemoryValue = valueInMB => {
		if (!valueInMB || Number.isNaN(valueInMB)) {
			return '—'
		}
		if (valueInMB >= 1024) {
			const inGB = valueInMB / 1024
			return `${inGB.toFixed(inGB >= 10 ? 0 : 1)} ГБ`
		}
		return `${valueInMB.toFixed(1)} МБ`
	}

	const formatBytes = bytes => {
		if (!bytes || Number.isNaN(bytes)) return '—'
		const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
		let value = Number(bytes)
		let unitIndex = 0
		while (value >= 1024 && unitIndex < units.length - 1) {
			value /= 1024
			unitIndex++
		}
		return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
	}

	const renderInfoRow = (label, value, options = {}) => {
		const { variant = 'default' } = options
		const valueClass = `process-details-value${
			variant === 'highlight' ? ' process-details-value--highlight' : ''
		}${variant === 'code' ? ' process-details-value--code' : ''}`
		return (
			<div className='process-details-item'>
				<span className='process-details-label'>{label}</span>
				<span className={valueClass}>{value || '—'}</span>
			</div>
		)
	}

	return (
		<div
			className='process-details-overlay'
			role='dialog'
			aria-modal='true'
			onClick={onClose}
		>
			<div
				className='process-details-modal'
				onClick={event => event.stopPropagation()}
			>
				<div className='process-details-header'>
					<div className='process-details-header-info'>
						<h2 className='process-details-title'>Информация о процессе</h2>
						<p className='process-details-subtitle'>
							Пользователь: <strong>{process?.username || '—'}</strong>
						</p>
					</div>
					<button
						type='button'
						className='process-details-close'
						onClick={onClose}
						aria-label='Закрыть модальное окно'
					>
						<span aria-hidden='true'>×</span>
					</button>
				</div>
				<div className='process-details-content'>
					<section className='process-details-section'>
						<h3 className='process-details-section-title'>Основные сведения</h3>
						<div className='process-details-grid'>
							{renderInfoRow('PID', process?.pid)}
							{renderInfoRow('Имя процесса', process?.name || '—')}
							{renderInfoRow('PPID', process?.ppid || '—')}
							{renderInfoRow('Время запуска', formatDate(process?.createTime))}
						</div>
					</section>
					<section className='process-details-section'>
						<h3 className='process-details-section-title'>Нагрузка</h3>
						<div className='process-details-grid'>
							{renderInfoRow('CPU', `${cpuPercent.toFixed(2)} %`, {
								variant: 'highlight',
							})}
							{renderInfoRow(
								'Память',
								`${formatMemoryValue(memoryMb)} (${formatBytes(
									process?.memoryRss
								)})`,
								{ variant: 'highlight' }
							)}
							{renderInfoRow('Потоки', process?.numThreads || '—')}
							{renderInfoRow(
								'Приоритет',
								process?.nice || process?.priority || '—'
							)}
						</div>
					</section>
					<section className='process-details-section'>
						<h3 className='process-details-section-title'>Пути и команды</h3>
						<div className='process-details-grid process-details-grid--single'>
							{renderInfoRow('Путь к исполняемому файлу', process?.exe || '—', {
								variant: 'code',
							})}
							{renderInfoRow('Командная строка', process?.cmdline || '—', {
								variant: 'code',
							})}
						</div>
					</section>
					<section className='process-details-section'>
						<h3 className='process-details-section-title'>
							Дополнительная информация
						</h3>
						<div className='process-details-grid'>
							{renderInfoRow('Статус', process?.status || '—')}
							{renderInfoRow(
								'Использование диска',
								process?.ioReadBytes ? formatBytes(process.ioReadBytes) : '—'
							)}
							{renderInfoRow(
								'Запись на диск',
								process?.ioWriteBytes ? formatBytes(process.ioWriteBytes) : '—'
							)}
							{renderInfoRow('Описание', process?.description || '—')}
						</div>
					</section>
				</div>
			</div>
		</div>
	)
}

export default ProcessDetailsModal
