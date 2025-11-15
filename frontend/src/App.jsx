import { useEffect } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import SystemMonitorLogo from './assets/system-monitor-logo.svg'
import ConfirmModalContainer from './components/confirm-modal/ConfirmModalContainer'
import MetricsDashboard from './components/metrics-dashboard/MetricsDashboard'
import NotificationsContainer from './components/notifications/NotificationsContainer'
import Processes from './components/processes/Processes'
import PortManager from './pages/Tcp/PortManager'
import { useAppDispatch, useAppSelector } from './store/hooks'

import { fetchHostInfo } from './store/slices/hostInfoSlice'
import {
	fetchMonitoringStatus,
	setMonitoringStatus,
} from './store/slices/monitoringSlice'

function App() {
	const dispatch = useAppDispatch()
	const { username, hostname } = useAppSelector(state => state.hostInfo)

	const { enabled: isMonitoringActive, loading } = useAppSelector(
		state => state.monitoring
	)

	useEffect(() => {
		dispatch(fetchMonitoringStatus())
	}, [dispatch])

	const toggleMonitoring = async () => {
		const newStatus = !isMonitoringActive
		const result = await dispatch(setMonitoringStatus(newStatus))

		if (setMonitoringStatus.rejected.match(result)) {
			alert(
				'Не удалось ' + (newStatus ? 'включить' : 'выключить') + ' мониторинг'
			)
		}
	}

	useEffect(() => {
		dispatch(fetchHostInfo())
	}, [dispatch])

	return (
		<div className='app'>
			<header className='app-header'>
				<div className='app-header-content'>
					<img src={SystemMonitorLogo} alt='Nexora' className='app-logo' />
					<div className='app-tite-item'>
						<h1 className='app-title'>Nexora</h1>
						<p className='app-subtitle'>
							Мониторинг процессов, CPU, памяти и сети в реальном времени
						</p>
					</div>
				</div>
				<div className='account-item'>
					<div className='account-actions'>
						<button
							className='shutdown-button'
							onClick={toggleMonitoring}
							disabled={loading}
							style={{
								backgroundColor: isMonitoringActive ? '#ff4d4f' : '#52c41a',
								color: 'white',
								border: 'none',
								padding: '6px 12px',
								borderRadius: '6px',
								cursor: loading ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							}}
						>
							{loading ? (
								'Загрузка...'
							) : isMonitoringActive ? (
								<>
									<svg
										width='16'
										height='16'
										viewBox='0 0 16 16'
										fill='none'
										xmlns='http://www.w3.org/2000/svg'
									>
										<rect
											x='3'
											y='3'
											width='10'
											height='10'
											rx='2'
											fill='currentColor'
										/>
									</svg>
									Выключить мониторинг
								</>
							) : (
								<>
									<svg
										width='16'
										height='16'
										viewBox='0 0 16 16'
										fill='none'
										xmlns='http://www.w3.org/2000/svg'
									>
										<path
											d='M2 8L5 5L7 10L10 3L12 8L14 6'
											stroke='currentColor'
											strokeWidth='1.5'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
									Включить мониторинг
								</>
							)}
						</button>
					</div>
					<div className='account-info'>
						<div className='account-field'>
							<svg
								className='account-icon'
								width='16'
								height='16'
								viewBox='0 0 16 16'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
							>
								<path
									d='M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z'
									fill='currentColor'
								/>
								<path
									d='M8 10C4.68629 10 2 12.6863 2 16H14C14 12.6863 11.3137 10 8 10Z'
									fill='currentColor'
								/>
							</svg>
							<div className='account-field-content'>
								<span className='account-label'>Пользователь</span>
								<span className='account-value'>{username || '—'}</span>
							</div>
						</div>
						<div className='account-divider'></div>
						<div className='account-field'>
							<svg
								className='account-icon'
								width='16'
								height='16'
								viewBox='0 0 16 16'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
							>
								<rect
									x='2'
									y='3'
									width='12'
									height='9'
									rx='1'
									stroke='currentColor'
									strokeWidth='1.5'
									fill='none'
								/>
								<path
									d='M2 6H14'
									stroke='currentColor'
									strokeWidth='1.5'
									strokeLinecap='round'
								/>
								<path
									d='M5 9H11'
									stroke='currentColor'
									strokeWidth='1.5'
									strokeLinecap='round'
								/>
								<path
									d='M6 12H10'
									stroke='currentColor'
									strokeWidth='1.5'
									strokeLinecap='round'
								/>
								<circle cx='8' cy='7.5' r='0.5' fill='currentColor' />
							</svg>
							<div className='account-field-content'>
								<span className='account-label'>Хост</span>
								<span className='account-value'>{hostname || '—'}</span>
							</div>
						</div>
					</div>
				</div>
			</header>
			<nav className='app-nav'>
				<div className='app-nav-container'>
					<NavLink
						to='/metrics'
						className={({ isActive }) =>
							`nav-link` + (isActive ? ' nav-link--active' : '')
						}
					>
						<div className='nav-link-icon'>
							<svg
								width='20'
								height='20'
								viewBox='0 0 20 20'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
							>
								<path
									d='M3.33333 16.6667H16.6667'
									stroke='currentColor'
									strokeWidth='1.5'
									strokeLinecap='round'
								/>
								<path
									d='M5 13.3333L7.5 8.33333L10 11.6667L12.5 6.66667L15 13.3333'
									stroke='currentColor'
									strokeWidth='1.5'
									strokeLinecap='round'
									strokeLinejoin='round'
									fill='none'
								/>
								<circle cx='5' cy='13.3333' r='1.25' fill='currentColor' />
								<circle cx='7.5' cy='8.33333' r='1.25' fill='currentColor' />
								<circle cx='10' cy='11.6667' r='1.25' fill='currentColor' />
								<circle cx='12.5' cy='6.66667' r='1.25' fill='currentColor' />
								<circle cx='15' cy='13.3333' r='1.25' fill='currentColor' />
							</svg>
						</div>
						<span className='nav-link-text'>Метрики</span>
						<div className='nav-link-indicator'></div>
					</NavLink>
					<NavLink
						to='/processes'
						className={({ isActive }) =>
							`nav-link` + (isActive ? ' nav-link--active' : '')
						}
					>
						<div className='nav-link-icon'>
							<svg
								width='20'
								height='20'
								viewBox='0 0 20 20'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
							>
								<rect
									x='3.33333'
									y='3.33333'
									width='13.3333'
									height='13.3333'
									rx='1.5'
									stroke='currentColor'
									strokeWidth='1.5'
									fill='none'
								/>
								<circle cx='6.66667' cy='7.5' r='1' fill='currentColor' />
								<path
									d='M9.16667 7.5H13.3333'
									stroke='currentColor'
									strokeWidth='1.5'
									strokeLinecap='round'
								/>
								<circle cx='6.66667' cy='10.8333' r='1' fill='currentColor' />
								<path
									d='M9.16667 10.8333H13.3333'
									stroke='currentColor'
									strokeWidth='1.5'
									strokeLinecap='round'
								/>
								<circle cx='6.66667' cy='14.1667' r='1' fill='currentColor' />
								<path
									d='M9.16667 14.1667H11.6667'
									stroke='currentColor'
									strokeWidth='1.5'
									strokeLinecap='round'
								/>
							</svg>
						</div>
						<span className='nav-link-text'>Процессы</span>
						<div className='nav-link-indicator'></div>
					</NavLink>

					<NavLink
						to='/port-manager'
						className={({ isActive }) =>
							`nav-link` + (isActive ? ' nav-link--active' : '')
						}
					>
						<svg
							width='20'
							height='20'
							viewBox='0 0 20 20'
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
						<span className='nav-link-text'>Сетевые порты</span>
						<div className='nav-link-indicator'></div>
					</NavLink>
				</div>
			</nav>
			<main className='app-main'>
				<div className='monitor-container'>
					<Routes>
						<Route path='/metrics' element={<MetricsDashboard />} />
						<Route path='/processes' element={<Processes />} />
						<Route path='/port-manager' element={<PortManager />} />
						<Route path='/' element={<Navigate to='/metrics' replace />} />
					</Routes>
				</div>
			</main>
			<NotificationsContainer />
			<ConfirmModalContainer />
		</div>
	)
}

export default App
