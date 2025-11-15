import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import ProgressLoader from '../../components/loader/ProgressLoader'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
	completeLoading,
	setStepProgress,
	startLoading,
} from '../../store/slices/loadingProgressSlice'
import { addNotification } from '../../store/slices/notificationsSlice'
import { notifyError, notifySuccess } from '../../utils/notifications'

import styles from './PortManager.module.css'
const PortManager = () => {
	const dispatch = useAppDispatch()
	const [ports, setPorts] = useState([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [showOnlyListening, setShowOnlyListening] = useState(true)
	const [newProcess, setNewProcess] = useState({
		command: '',
		args: '',
		cwd: '',
	})

	const tableScrollRef = useRef(null)

	const { isInitialLoading } = useAppSelector(state => state.processes)
	const { progress, isLoading } = useAppSelector(state => state.loadingProgress)

	const fetchPorts = async () => {
		dispatch(startLoading())
		try {
			dispatch(setStepProgress({ step: 'api', progress: 10 }))
			const response = await axios.get(
				'http://localhost:8080/api/listening-ports'
			)
			dispatch(setStepProgress({ step: 'api', progress: 30 }))
			setPorts(response.data)
			dispatch(setStepProgress({ step: 'api', progress: 50 }))
		} catch (error) {
			console.error('Ошибка загрузки портов:', error)
		} finally {
			dispatch(setStepProgress({ step: 'api', progress: 70 }))

			dispatch(setStepProgress({ step: 'api', progress: 100 }))
			dispatch(completeLoading())
		}
	}

	useEffect(() => {
		fetchPorts()
	}, [])

	const handleInputChange = e => {
		const { name, value } = e.target
		setNewProcess(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async e => {
		e.preventDefault()
		if (!newProcess.command.trim()) {
			dispatch(addNotification(notifyError('Укажите команду для запуска')))
			return
		}

		const timestamp = new Date().toISOString()
		const payload = {
			command: newProcess.command,
			args: newProcess.args,
			timestamp,
			...(newProcess.cwd && { cwd: newProcess.cwd }),
		}

		try {
			const response = await axios.post(
				'http://localhost:8080/api/start-processes',
				payload
			)

			dispatch(
				addNotification(
					notifySuccess(
						`Процесс запущен!\nPID: ${response.data.pid}\nКоманда: ${response.data.command} ${response.data.args}`
					)
				)
			)
			setIsModalOpen(false)
			setNewProcess({ command: '', args: '', cwd: '' })
			setTimeout(() => {
				fetchPorts()
			}, 1000)
		} catch (error) {
			const msg = error.response?.data || error.message || 'Неизвестная ошибка'

			dispatch(addNotification(notifySuccess(`Ошибка:\n${msg}`)))
		}
	}

	const renderStatus = status => {
		const isListening = status === 'LISTEN'
		return (
			<div className={styles.portStatusWrapper}>
				<span
					className={`${styles.portStatus} ${
						isListening ? styles.portStatusListen : styles.portStatusOther
					}`}
					title={
						isListening
							? 'Сервер: порт занят'
							: 'Клиент: порт можно использовать'
					}
				/>
				<span className={styles.portStatusText}>{status}</span>
			</div>
		)
	}

	const filteredPorts = showOnlyListening
		? ports.filter(p => p.status === 'LISTEN')
		: ports

	return (
		<div className={styles.portManager}>
			<div className={styles.portManagerHeader}>
				<div className={styles.portManagerTitleWrapper}>
					<svg
						className={styles.portManagerTitleIcon}
						width='24'
						height='24'
						viewBox='0 0 24 24'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'
					>
						<rect
							x='4'
							y='5'
							width='12'
							height='10'
							rx='2'
							stroke='currentColor'
							strokeWidth='1.5'
							fill='none'
						/>
						<circle cx='6' cy='8' r='1' fill='currentColor' />
						<circle cx='6' cy='12' r='1' fill='currentColor' />
						<circle cx='14' cy='8' r='1' fill='currentColor' />
						<circle cx='14' cy='12' r='1' fill='currentColor' />
						<line
							x1='16'
							y1='10'
							x2='19'
							y2='10'
							stroke='currentColor'
							strokeWidth='1.5'
							strokeLinecap='round'
						/>
					</svg>
					<h2>Сетевые соединения</h2>
				</div>
				<div className={styles.portManagerActions}>
					<button
						className={styles.portManagerButton}
						onClick={fetchPorts}
						title='Обновить список портов'
					>
						<svg
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
						>
							<polyline points='23 4 23 10 17 10' />
							<polyline points='1 20 1 14 7 14' />
							<path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' />
						</svg>
						<span>Обновить</span>
					</button>
					<button
						className={`${styles.portManagerButton} ${styles.portManagerButtonPrimary}`}
						onClick={() => setIsModalOpen(true)}
					>
						<svg
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
						>
							<line x1='12' y1='5' x2='12' y2='19' />
							<line x1='5' y1='12' x2='19' y2='12' />
						</svg>
						<span>Запустить процесс</span>
					</button>
				</div>
			</div>

			<div className={styles.portFilters}>
				<label className={styles.portFilterLabel}>
					<input
						type='checkbox'
						checked={showOnlyListening}
						onChange={e => setShowOnlyListening(e.target.checked)}
						className={styles.portFilterCheckbox}
					/>
					<span className={styles.portFilterCheckmark}></span>
					<span className={styles.portFilterText}>Только серверы (LISTEN)</span>
					{filteredPorts.length > 0 && (
						<span className={styles.portFilterCount}>
							({filteredPorts.length} из {ports.length})
						</span>
					)}
				</label>
			</div>

			{isLoading ? (
				<ProgressLoader
					progress={progress}
					message='Загрузка процессов...'
					isVisible={isInitialLoading || isLoading}
				/>
			) : filteredPorts.length === 0 ? (
				<div className={styles.portManagerEmpty}>
					<svg
						className={styles.portManagerEmptyIcon}
						width='64'
						height='64'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='1.5'
					>
						<rect x='4' y='5' width='12' height='10' rx='2' opacity='0.3' />
						<line x1='4' y1='10' x2='16' y2='10' opacity='0.3' />
						<circle cx='6' cy='8' r='1' />
						<circle cx='6' cy='12' r='1' />
						<circle cx='14' cy='8' r='1' />
						<circle cx='14' cy='12' r='1' />
					</svg>
					<p className={styles.portManagerEmptyText}>
						{showOnlyListening
							? 'Нет активных серверов'
							: 'Нет сетевых соединений'}
					</p>
					<p className={styles.portManagerEmptyHint}>
						{showOnlyListening
							? 'Попробуйте снять фильтр, чтобы увидеть все соединения'
							: 'Запустите процесс, чтобы увидеть сетевые соединения'}
					</p>
				</div>
			) : (
				<div className={styles.processesCard}>
					<div className={styles.processesTableWrapper}>
						<table className={styles.processesTable}>
							<thead>
								<tr>
									<th>Локальный адрес</th>
									<th>Удалённый адрес</th>
									<th>Протокол</th>
									<th>Статус</th>
									<th>PID</th>
									<th>Процесс</th>
								</tr>
							</thead>
							<tbody ref={tableScrollRef} className={styles.processesTableBody}>
								{filteredPorts.map(item => (
									<tr
										key={`${item.localAddr}-${item.remoteAddr}-${item.pid}-${item.status}`}
										className={
											item.status === 'LISTEN'
												? styles.portRowListen
												: styles.portRowOther
										}
									>
										<td>
											<span className={styles.portAddress}>
												{item.localAddr}
											</span>
										</td>
										<td>
											<span className={styles.portAddress}>
												{item.remoteAddr === '-' ? '—' : item.remoteAddr}
											</span>
										</td>
										<td>
											<span className={styles.portProtocol}>
												{item.protocol}
											</span>
										</td>
										<td>{renderStatus(item.status)}</td>
										<td>
											<span className={styles.portPid}>{item.pid}</span>
										</td>
										<td>
											<span className={styles.portProcess}>{item.process}</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className={styles.portLegend}>
						<div className={styles.legendItem}>
							<span
								className={`${styles.portStatus} ${styles.portStatusListen}`}
							/>{' '}
							<span>Сервер (порт занят — нельзя запустить другой)</span>
						</div>
						<div className={styles.legendItem}>
							<span
								className={`${styles.portStatus} ${styles.portStatusOther}`}
							/>{' '}
							<span>
								Клиент (временное соединение — порт можно использовать)
							</span>
						</div>
					</div>
				</div>
			)}

			{isModalOpen && (
				<div
					className={styles.processModalBackdrop}
					onClick={() => setIsModalOpen(false)}
				>
					<div
						className={styles.processModal}
						onClick={e => e.stopPropagation()}
					>
						<div className={styles.processModalHeader}>
							<div className={styles.processModalHeaderContent}>
								<svg
									className={styles.processModalIcon}
									width='24'
									height='24'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
								>
									<line x1='12' y1='5' x2='12' y2='19' />
									<line x1='5' y1='12' x2='19' y2='12' />
								</svg>
								<h3 className={styles.processModalTitle}>
									Запустить новый процесс
								</h3>
							</div>
							<button
								className={styles.processModalClose}
								onClick={() => setIsModalOpen(false)}
								aria-label='Закрыть'
							>
								<svg
									width='20'
									height='20'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
								>
									<line x1='18' y1='6' x2='6' y2='18' />
									<line x1='6' y1='6' x2='18' y2='18' />
								</svg>
							</button>
						</div>
						<form onSubmit={handleSubmit} className={styles.processModalBody}>
							<div className={styles.addProcessField}>
								<label className={styles.addProcessFieldLabel}>
									<svg
										className={styles.addProcessFieldIcon}
										width='16'
										height='16'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
									>
										<path d='M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4' />
										<polyline points='8 12 12 16 16 12' />
										<line x1='12' y1='8' x2='12' y2='16' />
									</svg>
									Команда *
								</label>
								<input
									type='text'
									name='command'
									value={newProcess.command}
									onChange={handleInputChange}
									placeholder='vite, node, python3, npm и т.д.'
									className={styles.addProcessFieldInput}
									required
								/>
							</div>

							<div className={styles.addProcessField}>
								<label className={styles.addProcessFieldLabel}>
									<svg
										className={styles.addProcessFieldIcon}
										width='16'
										height='16'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
									>
										<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
										<polyline points='14 2 14 8 20 8' />
										<line x1='16' y1='13' x2='8' y2='13' />
										<line x1='16' y1='17' x2='8' y2='17' />
										<polyline points='10 9 9 9 8 9' />
									</svg>
									Аргументы
								</label>
								<input
									type='text'
									name='args'
									value={newProcess.args}
									onChange={handleInputChange}
									placeholder='--port=8081 или run dev -- --port=5173'
									className={styles.addProcessFieldInput}
								/>
							</div>

							<div className={styles.addProcessField}>
								<label className={styles.addProcessFieldLabel}>
									<svg
										className={styles.addProcessFieldIcon}
										width='16'
										height='16'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
									>
										<path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' />
										<path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' />
									</svg>
									Рабочая директория (необязательно)
								</label>
								<input
									type='text'
									name='cwd'
									value={newProcess.cwd}
									onChange={handleInputChange}
									placeholder='Пример: /home/user/my-app или C:\my-project'
									className={styles.addProcessFieldInput}
								/>
							</div>

							<div className={styles.addProcessHint}>
								Примеры:
								<br />
								<code>vite</code> + <code>--port=8081</code> → запустит
								dev-сервер на порту 8081
								<br />
								<code>npm</code> + <code>run dev -- --port=3000</code> → для
								npm-проектов
								<br />
								Если порт занят <strong>сервером (LISTEN)</strong> — выберите
								другой.
							</div>
						</form>
						<div className={styles.processModalFooter}>
							<button
								type='button'
								className={`${styles.processModalButton} ${styles.processModalButtonCancel}`}
								onClick={() => setIsModalOpen(false)}
							>
								Отмена
							</button>
							<button
								type='submit'
								className={`${styles.processModalButton} ${styles.processModalButtonConfirm}`}
								onClick={handleSubmit}
							>
								Запустить
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default PortManager
