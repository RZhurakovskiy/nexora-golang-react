import { useEffect, useMemo, useRef, useState } from 'react'
import RealtimeSocket from '../../services/RealtimeSocket'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { openConfirmModal } from '../../store/slices/confirmModalSlice'
import {
	completeLoading,
	resetLoading,
	setStepProgress,
	startLoading,
} from '../../store/slices/loadingProgressSlice'
import { setMonitoringEnabled } from '../../store/slices/monitoringSlice'
import { addNotification } from '../../store/slices/notificationsSlice'
import {
	clearProcesses,
	killProcess,
	setInitialLoading,
	setProcesses,
	setWsStatus,
} from '../../store/slices/processesSlice'
import { notifyError, notifySuccess } from '../../utils/notifications'
import { setConfirmModalCallbacks } from '../confirm-modal/ConfirmModalContainer'
import ProgressLoader from '../loader/ProgressLoader'
import ProcessDetailsModal from '../process-details/ProcessDetailsModal'
import WebSocketStatusIndicator from '../websocket-status/WebSocketStatusIndicator'
import ProcessAutocomplete from './ProcessAutocomplete'
import './Processes.css'
import './Table.css'
const Processes = () => {
	const dispatch = useAppDispatch()
	const { processes, wsStatus, isInitialLoading, error } = useAppSelector(
		state => state.processes
	)
	const { progress, isLoading } = useAppSelector(state => state.loadingProgress)
	const { enabled: monitoringEnabled } = useAppSelector(
		state => state.monitoring
	)

	const isServerOffline =
		wsStatus === 'error' || wsStatus === 'disconnected' || !monitoringEnabled
	const effectiveStatus =
		!monitoringEnabled && wsStatus === 'connected' ? 'disconnected' : wsStatus

	const [showUnknown, setShowUnknown] = useState(false)
	const [searchQueries, setSearchQueries] = useState({
		pid: '',
		name: '',
		port: '',
	})
	const [renderCount, setRenderCount] = useState(100)
	const [filters, setFilters] = useState({
		username: '',
		cpuMin: '',
		cpuMax: '',
		memoryMin: '',
		memoryMax: '',
	})
	const [showFilters, setShowFilters] = useState(false)
	const [sortBy, setSortBy] = useState(null)
	const [sortOrder, setSortOrder] = useState('desc')
	const [selectedProcess, setSelectedProcess] = useState(null)
	const [isModalOpen, setIsModalOpen] = useState(false)

	const socketRef = useRef(null)
	const tableScrollRef = useRef(null)
	const monitoringEnabledRef = useRef(monitoringEnabled)
	const isInitializedRef = useRef(false)
	const searchPidContainerRef = useRef(null)
	const searchNameContainerRef = useRef(null)
	const searchPortContainerRef = useRef(null)

	useEffect(() => {
		monitoringEnabledRef.current = monitoringEnabled
	}, [monitoringEnabled])

	const PAGE_SIZE = 100

	const handleKillProcessClick = process => {
		const processName = process?.name || 'Неизвестный процесс'
		const processPid = process?.pid || 'N/A'

		setConfirmModalCallbacks(() => {
			handleKillProcess(processPid)
		}, null)

		dispatch(
			openConfirmModal({
				title: 'Подтверждение завершения процесса',
				message: `Вы уверены, что хотите завершить процесс?\n\nPID: ${processPid}\nНазвание: ${processName}\n\nЭто действие нельзя отменить.`,
				confirmText: 'Завершить процесс',
				cancelText: 'Отмена',
			})
		)
	}

	const handleKillProcess = async pid => {
		const result = await dispatch(killProcess(pid))
		if (killProcess.fulfilled.match(result)) {
			dispatch(
				addNotification(
					notifySuccess('Процесс успешно завершён', 'Процесс завершён')
				)
			)
		} else {
			dispatch(
				addNotification(
					notifyError(result.payload || 'Не удалось завершить процесс')
				)
			)
		}
	}

	const handleViewProcess = process => {
		setSelectedProcess(process)
		setIsModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsModalOpen(false)
		setSelectedProcess(null)
	}

	useEffect(() => {
		if (
			isInitializedRef.current ||
			(socketRef.current && socketRef.current.ws)
		) {
			return
		}
		isInitializedRef.current = true

		dispatch(startLoading())
		dispatch(setInitialLoading(true))
		dispatch(setStepProgress({ step: 'websocket', progress: 10 }))

		const socket = new RealtimeSocket('ws://localhost:8080/ws/processes')
		socket.setHandlers({
			onStatusChange: status => dispatch(setWsStatus(status)),
			onOpen: () => {
				dispatch(setStepProgress({ step: 'websocket', progress: 100 }))
				dispatch(setStepProgress({ step: 'api', progress: 10 }))
			},
			onMessage: evt => {
				try {
					const msg = JSON.parse(evt.data || '[]')

					if (msg && typeof msg === 'object' && !Array.isArray(msg)) {
						if (msg.monitoringEnabled !== undefined) {
							dispatch(setMonitoringEnabled(msg.monitoringEnabled))

							if (!msg.monitoringEnabled) {
								dispatch(clearProcesses())
								return
							}
						}

						return
					}

					if (!Array.isArray(msg)) return

					if (!monitoringEnabledRef.current) {
						dispatch(clearProcesses())
						return
					}

					dispatch(setStepProgress({ step: 'api', progress: 100 }))
					setTimeout(() => {
						dispatch(setProcesses(msg))
						dispatch(completeLoading())
						dispatch(setInitialLoading(false))
					}, 300)
				} catch (err) {
					dispatch(resetLoading())
					dispatch(setInitialLoading(false))
				}
			},
			onError: () => {
				dispatch(resetLoading())
			},
		})
		socket.start()
		socketRef.current = socket

		return () => {
			if (socketRef.current) {
				socketRef.current.stop()
				socketRef.current = null
			}
			isInitializedRef.current = false
		}
	}, [dispatch])

	useEffect(() => {
		if (!monitoringEnabled) {
			dispatch(clearProcesses())
		}
	}, [monitoringEnabled, dispatch])

	const isProcessUnknown = p => {
		const unknownName = !p?.name || p.name?.toLowerCase() === 'неизвестно'
		const emptyMeta =
			(!p?.exe || p.exe === '') &&
			(!p?.cmdline || p.cmdline === '') &&
			(!p?.username || p.username === '') &&
			(!p?.createTime || p.createTime === 0)
		return unknownName || emptyMeta
	}

	const getCpuPercentNumber = p => {
		const v = Number(p?.cpuPercent ?? 0)
		if (Number.isNaN(v)) return 0

		return Math.max(0, v)
	}

	const getMemoryMb = p => {
		const bytes = Number(p?.memoryRss ?? 0)
		if (Number.isNaN(bytes) || bytes <= 0) return 0
		return bytes / (1024 * 1024)
	}

	const formatPorts = p => {
		const ports = p?.ports || []
		if (ports.length === 0) {
			return '—'
		}
		return ports.join(', ')
	}

	const isActiveProcess = p => {
		return getCpuPercentNumber(p) > 0 || getMemoryMb(p) > 0
	}

	const getRowSeverity = p => {
		const cpu = getCpuPercentNumber(p)
		const memMb = getMemoryMb(p)

		if (cpu >= 60 || memMb >= 800) return 'critical'
		if (cpu >= 30 || memMb >= 400) return 'elevated'

		return 'normal'
	}

	const { visibleRows, unknownCount, activeCount } = useMemo(() => {
		const unknown = processes.filter(isProcessUnknown)
		const known = processes.filter(p => !isProcessUnknown(p))

		const active = known.filter(isActiveProcess)
		const inactive = known.filter(p => !isActiveProcess(p))

		const sortByLoad = (a, b) => {
			const cpuDiff = getCpuPercentNumber(b) - getCpuPercentNumber(a)
			if (cpuDiff !== 0) return cpuDiff
			const memDiff = getMemoryMb(b) - getMemoryMb(a)
			if (memDiff !== 0) return memDiff
			return String(a.name || '').localeCompare(String(b.name || ''))
		}

		active.sort(sortByLoad)
		inactive.sort(sortByLoad)

		const base = [...active, ...inactive]
		const withUnknown = showUnknown ? [...base, ...unknown] : base

		return {
			visibleRows: withUnknown,
			unknownCount: unknown.length,
			activeCount: active.length,
		}
	}, [processes, showUnknown])

	const hasUnknownProcess = unknownCount > 0

	const filteredRows = useMemo(() => {
		let result = visibleRows

		if (searchQueries.pid.trim()) {
			const pidQuery = searchQueries.pid.trim().toLowerCase()
			result = result.filter(p => String(p?.pid || '').includes(pidQuery))
		}

		if (searchQueries.name.trim()) {
			const nameQuery = searchQueries.name.trim().toLowerCase()
			result = result.filter(p =>
				String(p?.name || '')
					.toLowerCase()
					.includes(nameQuery)
			)
		}

		if (searchQueries.port.trim()) {
			const portQuery = searchQueries.port.trim().toLowerCase()
			result = result.filter(p => {
				const ports = p?.ports || []
				return ports.some(port => String(port).includes(portQuery))
			})
		}

		if (filters.username) {
			const usernameFilter = filters.username.trim().toLowerCase()
			result = result.filter(p =>
				String(p?.username || '')
					.toLowerCase()
					.includes(usernameFilter)
			)
		}

		const cpuMin = filters.cpuMin ? parseFloat(filters.cpuMin) : null
		const cpuMax = filters.cpuMax ? parseFloat(filters.cpuMax) : null
		if (cpuMin !== null || cpuMax !== null) {
			result = result.filter(p => {
				const cpu = getCpuPercentNumber(p)
				if (cpuMin !== null && cpu < cpuMin) return false
				if (cpuMax !== null && cpu > cpuMax) return false
				return true
			})
		}

		const memMin = filters.memoryMin ? parseFloat(filters.memoryMin) : null
		const memMax = filters.memoryMax ? parseFloat(filters.memoryMax) : null
		if (memMin !== null || memMax !== null) {
			result = result.filter(p => {
				const mem = getMemoryMb(p)
				if (memMin !== null && mem < memMin) return false
				if (memMax !== null && mem > memMax) return false
				return true
			})
		}

		if (sortBy) {
			result = [...result].sort((a, b) => {
				let aValue, bValue
				if (sortBy === 'cpu') {
					aValue = getCpuPercentNumber(a)
					bValue = getCpuPercentNumber(b)
				} else if (sortBy === 'memory') {
					aValue = getMemoryMb(a)
					bValue = getMemoryMb(b)
				} else {
					return 0
				}

				if (sortOrder === 'asc') {
					return aValue - bValue
				} else {
					return bValue - aValue
				}
			})
		}

		return result
	}, [visibleRows, searchQueries, filters, sortBy, sortOrder])

	const handleSort = column => {
		if (sortBy === column) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			setSortBy(column)
			setSortOrder('desc')
		}
	}

	const renderSortIcon = column => {
		if (sortBy !== column) {
			return (
				<svg
					className='sort-icon sort-icon--inactive'
					width='16'
					height='16'
					viewBox='0 0 16 16'
					fill='none'
					xmlns='http://www.w3.org/2000/svg'
				>
					<path
						d='M8 3L11 6H9V13H7V6H5L8 3Z'
						fill='currentColor'
						opacity='0.4'
					/>
					<path
						d='M8 13L5 10H7V3H9V10H11L8 13Z'
						fill='currentColor'
						opacity='0.4'
					/>
				</svg>
			)
		}
		return (
			<svg
				className={`sort-icon sort-icon--${sortOrder}`}
				width='16'
				height='16'
				viewBox='0 0 16 16'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'
			>
				{sortOrder === 'asc' ? (
					<path d='M8 3L11 6H9V13H7V6H5L8 3Z' fill='currentColor' />
				) : (
					<path d='M8 13L5 10H7V3H9V10H11L8 13Z' fill='currentColor' />
				)}
			</svg>
		)
	}

	useEffect(() => {
		setRenderCount(PAGE_SIZE)
	}, [filteredRows])

	const onScrollLoadMore = () => {
		const el = tableScrollRef.current
		if (!el) return
		const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 48
		if (nearBottom) {
			setRenderCount(prev =>
				prev < filteredRows.length ? prev + PAGE_SIZE : prev
			)
		}
	}

	const renderLoadBar = (value, max = 100) => {
		const clamped = Math.max(0, Math.min(value, max))
		let tone = 'ok'
		if (clamped >= 60) tone = 'critical'
		else if (clamped >= 30) tone = 'elevated'
		const label = `${clamped.toFixed(1)}\u202F%`
		return (
			<div className='loadbar-wrap'>
				<div className='loadbar'>
					<div
						className={`loadbar__fill loadbar__fill--${tone}`}
						style={{ width: `${clamped}%` }}
					/>
				</div>
				<div className='loadbar__label--outside'>{label}</div>
			</div>
		)
	}

	const renderMemBar = mb => {
		const percent = Math.max(0, Math.min((mb / 16000) * 100, 100))
		let tone = 'ok'
		if (mb >= 800) tone = 'critical'
		else if (mb >= 400) tone = 'elevated'
		const label = `${mb.toFixed(1)}\u202FMB`
		return (
			<div className='loadbar-wrap'>
				<div className='loadbar'>
					<div
						className={`loadbar__fill loadbar__fill--${tone}`}
						style={{ width: `${percent}%` }}
					/>
				</div>
				<div className='loadbar__label--outside'>{label}</div>
			</div>
		)
	}

	return (
		<div className='processes-container'>
			<div className='processes-header'>
				<div className='processes-header-left'>
					<h2 className='processes-title'>Запущенные процессы</h2>
					<WebSocketStatusIndicator status={effectiveStatus} label='Процессы' />
				</div>
				<div className='processes-toolbar'>
					<div className='processes-search-group'>
						<div
							className='processes-search-wrapper'
							ref={searchPidContainerRef}
						>
							<div className='processes-search'>
								<input
									type='text'
									placeholder='Поиск по PID...'
									value={searchQueries.pid}
									onChange={e =>
										setSearchQueries(prev => ({ ...prev, pid: e.target.value }))
									}
									className='processes-search-input'
								/>
								{searchQueries.pid && (
									<button
										type='button'
										className='processes-search-clear'
										onClick={() =>
											setSearchQueries(prev => ({ ...prev, pid: '' }))
										}
										title='Очистить поиск по PID'
										aria-label='Очистить поиск по PID'
									>
										<svg
											width='16'
											height='16'
											viewBox='0 0 16 16'
											fill='none'
											xmlns='http://www.w3.org/2000/svg'
										>
											<path
												d='M12 4L4 12M4 4L12 12'
												stroke='currentColor'
												strokeWidth='2'
												strokeLinecap='round'
											/>
										</svg>
									</button>
								)}
							</div>
							<ProcessAutocomplete
								processes={visibleRows}
								value={searchQueries.pid}
								onSelect={value =>
									setSearchQueries(prev => ({ ...prev, pid: value }))
								}
								containerRef={searchPidContainerRef}
								searchType='pid'
							/>
						</div>
						<div
							className='processes-search-wrapper'
							ref={searchNameContainerRef}
						>
							<div className='processes-search'>
								<input
									type='text'
									placeholder='Поиск по имени...'
									value={searchQueries.name}
									onChange={e =>
										setSearchQueries(prev => ({
											...prev,
											name: e.target.value,
										}))
									}
									className='processes-search-input'
								/>
								{searchQueries.name && (
									<button
										type='button'
										className='processes-search-clear'
										onClick={() =>
											setSearchQueries(prev => ({ ...prev, name: '' }))
										}
										title='Очистить поиск по имени'
										aria-label='Очистить поиск по имени'
									>
										<svg
											width='16'
											height='16'
											viewBox='0 0 16 16'
											fill='none'
											xmlns='http://www.w3.org/2000/svg'
										>
											<path
												d='M12 4L4 12M4 4L12 12'
												stroke='currentColor'
												strokeWidth='2'
												strokeLinecap='round'
											/>
										</svg>
									</button>
								)}
							</div>
							<ProcessAutocomplete
								processes={visibleRows}
								value={searchQueries.name}
								onSelect={value =>
									setSearchQueries(prev => ({ ...prev, name: value }))
								}
								containerRef={searchNameContainerRef}
								searchType='name'
							/>
						</div>
						<div
							className='processes-search-wrapper'
							ref={searchPortContainerRef}
						>
							<div className='processes-search'>
								<input
									type='text'
									placeholder='Поиск по порту...'
									value={searchQueries.port}
									onChange={e =>
										setSearchQueries(prev => ({
											...prev,
											port: e.target.value,
										}))
									}
									className='processes-search-input'
								/>
								{searchQueries.port && (
									<button
										type='button'
										className='processes-search-clear'
										onClick={() =>
											setSearchQueries(prev => ({ ...prev, port: '' }))
										}
										title='Очистить поиск по порту'
										aria-label='Очистить поиск по порту'
									>
										<svg
											width='16'
											height='16'
											viewBox='0 0 16 16'
											fill='none'
											xmlns='http://www.w3.org/2000/svg'
										>
											<path
												d='M12 4L4 12M4 4L12 12'
												stroke='currentColor'
												strokeWidth='2'
												strokeLinecap='round'
											/>
										</svg>
									</button>
								)}
							</div>
							<ProcessAutocomplete
								processes={visibleRows}
								value={searchQueries.port}
								onSelect={value =>
									setSearchQueries(prev => ({ ...prev, port: value }))
								}
								containerRef={searchPortContainerRef}
								searchType='port'
							/>
						</div>
					</div>
					<button
						type='button'
						className='processes-filters-toggle'
						onClick={() => setShowFilters(!showFilters)}
						title='Показать/скрыть фильтры'
					>
						<svg
							width='16'
							height='16'
							viewBox='0 0 16 16'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path
								d='M2 4H14M4 8H12M6 12H10'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
							/>
						</svg>
						Фильтры
						{(filters.username ||
							filters.cpuMin ||
							filters.cpuMax ||
							filters.memoryMin ||
							filters.memoryMax) && (
							<span className='processes-filters-badge' />
						)}
					</button>
					<div className='processes-count'>Активные: {activeCount}</div>
					{hasUnknownProcess && (
						<button
							type='button'
							className='toggle-unknown-btn'
							onClick={() => setShowUnknown(v => !v)}
							title='Показать/скрыть неизвестные процессы'
						>
							{showUnknown
								? 'Скрыть неизвестные'
								: `Показать скрытые процессы (${unknownCount})`}
						</button>
					)}
				</div>
			</div>
			{showFilters && (
				<div className='processes-filters-panel'>
					<div className='processes-filters-header'>
						<h3 className='processes-filters-title'>Фильтры</h3>
						<button
							type='button'
							className='processes-filters-clear'
							onClick={() =>
								setFilters({
									username: '',
									cpuMin: '',
									cpuMax: '',
									memoryMin: '',
									memoryMax: '',
								})
							}
							title='Очистить все фильтры'
						>
							Очистить все
						</button>
					</div>
					<div className='processes-filters-grid'>
						<div className='processes-filter-group'>
							<label className='processes-filter-label'>Пользователь</label>
							<input
								type='text'
								className='processes-filter-input'
								placeholder='Имя пользователя...'
								value={filters.username}
								onChange={e =>
									setFilters(prev => ({ ...prev, username: e.target.value }))
								}
							/>
						</div>
						<div className='processes-filter-group'>
							<label className='processes-filter-label'>CPU (%)</label>
							<div className='processes-filter-range'>
								<input
									type='number'
									className='processes-filter-input'
									placeholder='Мин'
									min='0'
									max='100'
									step='0.1'
									value={filters.cpuMin}
									onChange={e =>
										setFilters(prev => ({ ...prev, cpuMin: e.target.value }))
									}
								/>
								<span className='processes-filter-separator'>—</span>
								<input
									type='number'
									className='processes-filter-input'
									placeholder='Макс'
									min='0'
									max='100'
									step='0.1'
									value={filters.cpuMax}
									onChange={e =>
										setFilters(prev => ({ ...prev, cpuMax: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className='processes-filter-group'>
							<label className='processes-filter-label'>Память (МБ)</label>
							<div className='processes-filter-range'>
								<input
									type='number'
									className='processes-filter-input'
									placeholder='Мин'
									min='0'
									step='0.1'
									value={filters.memoryMin}
									onChange={e =>
										setFilters(prev => ({ ...prev, memoryMin: e.target.value }))
									}
								/>
								<span className='processes-filter-separator'>—</span>
								<input
									type='number'
									className='processes-filter-input'
									placeholder='Макс'
									min='0'
									step='0.1'
									value={filters.memoryMax}
									onChange={e =>
										setFilters(prev => ({ ...prev, memoryMax: e.target.value }))
									}
								/>
							</div>
						</div>
					</div>
				</div>
			)}
			{isServerOffline ? (
				<div className='cpu-chart-container'>
					<div className='server-offline-message'>
						<div className='server-offline-icon'>⚠️</div>
						<h2 className='server-offline-title'>
							{!monitoringEnabled && wsStatus === 'connected'
								? 'Мониторинг выключен'
								: 'Сервер передачи данных выключен'}
						</h2>
						<p className='server-offline-description'>
							{!monitoringEnabled && wsStatus === 'connected'
								? 'Мониторинг выключен. Включите мониторинг для получения данных.'
								: 'Не удается подключиться к серверу мониторинга.'}
							<br />
							{!monitoringEnabled && wsStatus === 'connected' ? (
								<>
									Используйте кнопку "Включить мониторинг" в верхней части
									страницы.
								</>
							) : (
								<>
									Убедитесь, что сервер запущен и доступен по адресу{' '}
									<code>http://localhost:8080</code>
								</>
							)}
						</p>
					</div>
				</div>
			) : (
				<>
					<div className='processes-card'>
						<ProgressLoader
							progress={progress}
							message='Загрузка процессов...'
							isVisible={isInitialLoading || isLoading}
						/>

						{!isInitialLoading && !isLoading && filteredRows.length === 0 ? (
							<div className='empty-state'>
								<div className='empty-title'>Процесс не найден</div>
								<div className='empty-subtitle'>Измените запрос поиска.</div>
							</div>
						) : (
							<div className='processes-table-wrapper'>
								<table className='processes-table processes-table--header'>
									<thead>
										<tr>
											<th>PID</th>
											<th>Имя</th>
											<th>Путь</th>
											<th>Пользователь</th>
											<th>Порт</th>
											<th>
												<div className='table-header-with-sort'>
													<span>CPU</span>
													<button
														className='table-header-sort-button'
														onClick={() => handleSort('cpu')}
														title='Сортировать по CPU'
													>
														{renderSortIcon('cpu')}
													</button>
												</div>
											</th>
											<th>
												<div className='table-header-with-sort'>
													<span>Память</span>
													<button
														className='table-header-sort-button'
														onClick={() => handleSort('memory')}
														title='Сортировать по памяти'
													>
														{renderSortIcon('memory')}
													</button>
												</div>
											</th>
											<th>Действия</th>
										</tr>
									</thead>
								</table>

								<div
									className='processes-table-body-wrapper'
									ref={tableScrollRef}
									onScroll={onScrollLoadMore}
								>
									<table className='processes-table processes-table--body'>
										<tbody>
											{filteredRows.slice(0, renderCount).map(process => {
												const severity = getRowSeverity(process)
												const cpu = getCpuPercentNumber(process)
												const memMb = getMemoryMb(process)

												return (
													<tr key={process.pid} className={`row--${severity}`}>
														<td>{process.pid}</td>
														<td title={process?.cmdline || ''}>
															{process.name || '—'}
														</td>
														<td
															className='path-cell'
															title={process?.exe || ''}
														>
															{process?.exe || '—'}
														</td>
														<td>{process?.username || '—'}</td>
														<td>{formatPorts(process)}</td>
														<td>{renderLoadBar(cpu)}</td>
														<td>{renderMemBar(memMb)}</td>
														<td>
															<div className='process-actions'>
																<button
																	className='process-action-btn process-action-btn--view'
																	onClick={() => handleViewProcess(process)}
																	title='Просмотреть детали процесса'
																>
																	<svg
																		width='16'
																		height='16'
																		viewBox='0 0 16 16'
																		fill='none'
																		xmlns='http://www.w3.org/2000/svg'
																	>
																		<path
																			d='M8 2.5C4.5 2.5 1.73 4.61 0 7.5C1.73 10.39 4.5 12.5 8 12.5C11.5 12.5 14.27 10.39 16 7.5C14.27 4.61 11.5 2.5 8 2.5ZM8 10.5C6.34 10.5 5 9.16 5 7.5C5 5.84 6.34 4.5 8 4.5C9.66 4.5 11 5.84 11 7.5C11 9.16 9.66 10.5 8 10.5ZM8 6C7.17 6 6.5 6.67 6.5 7.5C6.5 8.33 7.17 9 8 9C8.83 9 9.5 8.33 9.5 7.5C9.5 6.67 8.83 6 8 6Z'
																			fill='currentColor'
																		/>
																	</svg>
																	<span>Посмотреть</span>
																</button>
																<button
																	className='process-action-btn process-action-btn--kill'
																	onClick={() =>
																		handleKillProcessClick(process)
																	}
																	title='Завершить процесс'
																>
																	Завершить
																</button>
															</div>
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
					{hasUnknownProcess && !showUnknown && (
						<div className='admin-hint'>
							<b>Часть процессов отображается как «неизвестно».</b> Для
							корректного получения списка процессов запустите сервер от имени
							администратора.
						</div>
					)}
				</>
			)}
			<ProcessDetailsModal
				process={selectedProcess}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				getCpuPercent={getCpuPercentNumber}
				getMemoryMb={getMemoryMb}
			/>
		</div>
	)
}

export default Processes
