import { useEffect, useState } from 'react'
import './ProgressLoader.css'

const ProgressLoader = ({
	progress = 0,
	message = 'Загрузка...',
	isVisible = true,
}) => {
	const [displayProgress, setDisplayProgress] = useState(0)

	useEffect(() => {
		const timer = setTimeout(() => {
			setDisplayProgress(progress)
		}, 50)

		return () => clearTimeout(timer)
	}, [progress])

	if (!isVisible) return null

	return (
		<div className='progress-loader-overlay'>
			<div className='progress-loader-content'>
				<div className='progress-loader-spinner'>
					<div className='spinner-system' />
				</div>
				<div className='progress-loader-text'>{message}</div>
				<div className='progress-loader-bar'>
					<div
						className='progress-loader-bar-fill'
						style={{ width: `${displayProgress}%` }}
					/>
				</div>
				<div className='progress-loader-percent'>
					{Math.round(displayProgress)}%
				</div>
			</div>
		</div>
	)
}

export default ProgressLoader
