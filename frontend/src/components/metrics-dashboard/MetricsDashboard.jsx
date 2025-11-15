import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchDeviceInfo } from '../../store/slices/deviceInfoSlice'
import CPUChart from '../cpu-chart/CPUChart'
import MemoryChart from '../memory-chart/MemoryChart'
import './MetricsDashboard.css'

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

const MetricsDashboard = () => {
	const dispatch = useAppDispatch()
	const { processname, cores } = useAppSelector(state => state.deviceInfo)
	const { latestSample } = useAppSelector(state => state.memory)

	useEffect(() => {
		dispatch(fetchDeviceInfo())
	}, [dispatch])
	return (
		<div className='metrics-dashboard'>
			<div className='metrics-dashboard-header'>
				<h2 className='metrics-dashboard-title'>Системные метрики</h2>
			</div>

			{/* Информационные панели */}
			<div className='metrics-info-panels'>
				<div className='metrics-info-panel'>
					<div className='metrics-info-panel-icon metrics-info-panel-icon--cpu'>
						<svg
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path
								d='M12 2L2 7L12 12L22 7L12 2Z'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
							<path
								d='M2 17L12 22L22 17'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
							<path
								d='M2 12L12 17L22 12'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</svg>
					</div>
					<div className='metrics-info-panel-content'>
						<div className='metrics-info-panel-label'>Процессор</div>
						<div className='metrics-info-panel-value'>{processname}</div>
						<div className='metrics-info-panel-detail'>
							<span>Ядер: {cores}</span>
						</div>
					</div>
				</div>

				<div className='metrics-info-panel'>
					<div className='metrics-info-panel-icon metrics-info-panel-icon--memory'>
						<svg
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<rect
								x='4'
								y='4'
								width='16'
								height='16'
								rx='2'
								stroke='currentColor'
								strokeWidth='2'
							/>
							<path
								d='M4 8H20'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
							/>
							<path
								d='M8 4V20'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
							/>
						</svg>
					</div>
					<div className='metrics-info-panel-content'>
						<div className='metrics-info-panel-label'>Оперативная память</div>
						<div className='metrics-info-panel-value'>
							{latestSample?.totalMemoryMB
								? formatMemoryValue(latestSample.totalMemoryMB)
								: '—'}
						</div>
						<div className='metrics-info-panel-detail'>
							<span>Частота: 3200 МГц</span>
						</div>
					</div>
				</div>

				<div className='metrics-info-panel'>
					<div className='metrics-info-panel-icon metrics-info-panel-icon--disk'>
						<svg
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<circle
								cx='12'
								cy='12'
								r='10'
								stroke='currentColor'
								strokeWidth='2'
							/>
							<circle
								cx='12'
								cy='12'
								r='3'
								stroke='currentColor'
								strokeWidth='2'
							/>
						</svg>
					</div>
					<div className='metrics-info-panel-content'>
						<div className='metrics-info-panel-label'>Диск</div>
						<div className='metrics-info-panel-value'>1 ТБ SSD</div>
						<div className='metrics-info-panel-detail'>
							<span>Использовано: 450 ГБ</span>
							<span>Свободно: 550 ГБ</span>
						</div>
					</div>
				</div>
			</div>

			{/* Графики */}
			<div className='metrics-charts'>
				<div className='metrics-chart-section'>
					<CPUChart />
				</div>
				<div className='metrics-chart-section'>
					<MemoryChart />
				</div>
			</div>
		</div>
	)
}

export default MetricsDashboard
