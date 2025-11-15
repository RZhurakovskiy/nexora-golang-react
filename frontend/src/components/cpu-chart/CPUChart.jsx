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
	addCpuData,
	clearCpuData,
	setWsStatus,
} from '../../store/slices/cpuSlice'
import { setMonitoringEnabled } from '../../store/slices/monitoringSlice'
import WebSocketStatusIndicator from '../websocket-status/WebSocketStatusIndicator'
import './CPUChart.css'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
)

const CPUChart = () => {
	const dispatch = useAppDispatch()
	const { data, wsStatus } = useAppSelector(state => state.cpu)
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

		const socket = new RealtimeSocket('ws://localhost:8080/ws/cpu')
		socket.setHandlers({
			onStatusChange: status => dispatch(setWsStatus(status)),
			onMessage: evt => {
				try {
					const msg = JSON.parse(evt.data || '{}')

					if (msg.monitoringEnabled !== undefined) {
						dispatch(setMonitoringEnabled(msg.monitoringEnabled))

						if (!msg.monitoringEnabled) {
							dispatch(clearCpuData())
							return
						}
					}

					if (!monitoringEnabledRef.current) {
						return
					}

					const cpu = typeof msg.cpu === 'number' ? msg.cpu : null
					const timestamp = msg.timestamp || ''
					if (cpu == null || !timestamp) return
					dispatch(addCpuData({ cpu, timestamp }))

					if (window.electronAPI && window.electronAPI.sendCpuLoad) {
						window.electronAPI.sendCpuLoad(cpu)
					}
				} catch (err) {}
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
			dispatch(clearCpuData())
		}
	}, [monitoringEnabled, dispatch])

	const latestCPU =
		data.datasets[0].data.length > 0
			? data.datasets[0].data[data.datasets[0].data.length - 1]
			: 0

	const getStatusColor = () => {
		if (latestCPU > 80) return '#ff453a'
		if (latestCPU > 60) return '#ff9500'
		return '#30d158'
	}

	const getStatusText = () => {
		if (latestCPU >= 80) return 'Высокая'
		if (latestCPU >= 40) return 'Средняя'
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
				text: 'Использование CPU',
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
					text: 'CPU (%)',
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
					<WebSocketStatusIndicator status={effectiveStatus} label='CPU' />
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
				<WebSocketStatusIndicator status={effectiveStatus} label='CPU' />
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
						{latestCPU.toFixed(1)}%
					</div>
					<div className='cpu-indicator-label'>Текущая нагрузка</div>
					<div
						className='cpu-indicator-status'
						style={{ color: getStatusColor() }}
					>
						{getStatusText()}
					</div>
				</div>
			</div>
		</div>
	)
}

export default CPUChart
