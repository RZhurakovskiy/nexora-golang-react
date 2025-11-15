import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip,
} from 'chart.js'
import { useEffect, useRef } from 'react'
import { Line } from 'react-chartjs-2'
import RealtimeSocket from '../../services/RealtimeSocket'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
	addMemoryData,
	clearMemoryData,
	setWsStatus,
} from '../../store/slices/memorySlice'
import { setMonitoringEnabled } from '../../store/slices/monitoringSlice'
import WebSocketStatusIndicator from '../websocket-status/WebSocketStatusIndicator'
import './memotyChart.css'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
)

const formatMemoryValue = valueInMB => {
	if (valueInMB === null || valueInMB === undefined) {
		return '—'
	}

	if (valueInMB >= 1024) {
		const inGB = valueInMB / 1024
		return `${inGB.toFixed(inGB >= 10 ? 0 : 1)} ГБ`
	}

	return `${Math.round(valueInMB)} МБ`
}

const MemoryChart = () => {
	const dispatch = useAppDispatch()
	const { data, samples, latestSample, wsStatus } = useAppSelector(
		state => state.memory
	)
	const { enabled: monitoringEnabled } = useAppSelector(
		state => state.monitoring
	)

	const isServerOffline =
		wsStatus === 'error' || wsStatus === 'disconnected' || !monitoringEnabled
	const effectiveStatus =
		!monitoringEnabled && wsStatus === 'connected' ? 'disconnected' : wsStatus

	const socketRef = useRef(null)
	const monitoringEnabledRef = useRef(monitoringEnabled)
	const isInitializedRef = useRef(false)

	useEffect(() => {
		monitoringEnabledRef.current = monitoringEnabled
	}, [monitoringEnabled])

	useEffect(() => {
		if (
			isInitializedRef.current ||
			(socketRef.current && socketRef.current.ws)
		) {
			return
		}
		isInitializedRef.current = true

		const socket = new RealtimeSocket('ws://localhost:8080/ws/memory')
		socket.setHandlers({
			onStatusChange: status => dispatch(setWsStatus(status)),
			onMessage: evt => {
				try {
					const msg = JSON.parse(evt.data || '{}')

					if (msg.monitoringEnabled !== undefined) {
						dispatch(setMonitoringEnabled(msg.monitoringEnabled))

						if (!msg.monitoringEnabled) {
							dispatch(clearMemoryData())
							return
						}
					}

					if (!monitoringEnabledRef.current) {
						return
					}

					dispatch(
						addMemoryData({
							memoryUsage: msg.memoryUsage,
							usedMB: msg.usedMB,
							totalMemory: msg.totalMemory,
							timestamp: msg.timestamp,
						})
					)
				} catch (err) {
					console.log(err)
				}
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
			dispatch(clearMemoryData())
		}
	}, [monitoringEnabled, dispatch])

	const latestMemoryPercent =
		data.datasets[0].data.length > 0
			? data.datasets[0].data[data.datasets[0].data.length - 1]
			: 0

	const getStatusColor = () => {
		if (latestMemoryPercent > 85) return '#ff453a'
		if (latestMemoryPercent > 65) return '#ff9500'
		return '#30d158'
	}

	const getStatusText = () => {
		if (latestMemoryPercent >= 85) return 'Критическая'
		if (latestMemoryPercent >= 65) return 'Высокая'
		if (latestMemoryPercent >= 40) return 'Средняя'
		return 'Низкая'
	}

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		animation: false,
		interaction: {
			mode: 'index',
			intersect: false,
		},
		plugins: {
			legend: {
				display: true,
				position: 'top',
				labels: {
					color: '#e5e5e7',
					font: {
						size: 12,
						weight: '500',
					},
					padding: 12,
					usePointStyle: true,
				},
			},
			title: {
				display: true,
				text: 'Использование ОЗУ',
				color: '#f5f5f7',
				font: {
					size: 16,
					weight: '600',
				},
				padding: {
					bottom: 20,
				},
			},
			tooltip: {
				backgroundColor: 'rgba(28, 28, 30, 0.95)',
				titleColor: '#f5f5f7',
				bodyColor: '#e5e5e7',
				borderColor: 'rgba(255, 255, 255, 0.1)',
				borderWidth: 1,
				padding: 12,
				cornerRadius: 8,
				displayColors: true,
				titleFont: {
					size: 13,
					weight: '600',
				},
				bodyFont: {
					size: 12,
				},
				callbacks: {
					label: context => {
						const point = samples[context.dataIndex]
						const percent = context.parsed.y
						if (point) {
							const used = formatMemoryValue(point.usedMB)
							const total = formatMemoryValue(point.totalMemoryMB)
							return `Использовано: ${used} из ${total} (${percent.toFixed(
								1
							)}%)`
						}
						return `Использование: ${percent.toFixed(1)}%`
					},
				},
			},
		},
		scales: {
			x: {
				grid: {
					color: 'rgba(255, 255, 255, 0.05)',
					drawBorder: false,
				},
				ticks: {
					color: '#8e8e93',
					font: {
						size: 11,
					},
					maxRotation: 45,
					minRotation: 45,
				},
				title: {
					display: true,
					text: 'Время',
					color: '#8e8e93',
					font: {
						size: 12,
						weight: '500',
					},
				},
			},
			y: {
				grid: {
					color: 'rgba(255, 255, 255, 0.05)',
					drawBorder: false,
				},
				ticks: {
					color: '#8e8e93',
					font: {
						size: 11,
					},
				},
				title: {
					display: true,
					text: 'ОЗУ (%)',
					color: '#8e8e93',
					font: {
						size: 12,
						weight: '500',
					},
				},
				min: 0,
				max: 100,
			},
		},
	}

	if (isServerOffline) {
		const message =
			!monitoringEnabled && wsStatus === 'connected'
				? 'Мониторинг выключен. Включите мониторинг для получения данных.'
				: 'Не удается подключиться к серверу мониторинга.'

		return (
			<div className='cpu-chart-container'>
				<div className='cpu-chart-header'>
					<WebSocketStatusIndicator status={effectiveStatus} label='Память' />
				</div>
				<div className='server-offline-message'>
					<div className='server-offline-icon'>⚠️</div>
					<h2 className='server-offline-title'>
						{!monitoringEnabled && wsStatus === 'connected'
							? 'Мониторинг выключен'
							: 'Сервер передачи данных выключен'}
					</h2>
					<p className='server-offline-description'>
						{message}
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
		)
	}

	return (
		<div className='cpu-chart-container'>
			<div className='cpu-chart-header'>
				<WebSocketStatusIndicator status={effectiveStatus} label='Память' />
			</div>
			<div className='cpu-chart-content'>
				<div className='cpu-chart-wrapper'>
					<Line options={options} data={data} />
				</div>

				<div className='cpu-indicator'>
					<div
						className='cpu-indicator-value'
						style={{ color: getStatusColor() }}
					>
						{latestMemoryPercent.toFixed(1)}%
					</div>
					<div className='cpu-indicator-label'>Текущая нагрузка памяти</div>
					<div
						className='cpu-indicator-status'
						style={{ color: getStatusColor() }}
					>
						{getStatusText()}
					</div>
					<div className='cpu-indicator-details'>
						{latestSample ? (
							<>
								<div className='memory-detail memory-detail-used'>
									<span className='memory-detail-label'>Использовано</span>
									<span className='memory-detail-value'>
										{formatMemoryValue(latestSample.usedMB)}
									</span>
								</div>
								<div className='memory-detail memory-detail-total'>
									<span className='memory-detail-label'>Всего</span>
									<span className='memory-detail-value'>
										{formatMemoryValue(latestSample.totalMemoryMB)}
									</span>
								</div>
							</>
						) : (
							<div>Данные ещё загружаются…</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default MemoryChart
