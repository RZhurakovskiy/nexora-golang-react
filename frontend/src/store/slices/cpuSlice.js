import { createSlice } from '@reduxjs/toolkit'

const MAX_DATA_POINTS = 60

const initialState = {
	data: {
		labels: [],
		datasets: [
			{
				label: 'Нагрузка CPU (%)',
				data: [],
				borderColor: 'rgb(0, 122, 255)',
				backgroundColor: 'rgba(0, 122, 255, 0.15)',
				tension: 0.4,
				fill: true,
				pointRadius: 0,
				pointHoverRadius: 4,
				borderWidth: 2,
			},
		],
	},
	wsStatus: 'disconnected',
}

const cpuSlice = createSlice({
	name: 'cpu',
	initialState,
	reducers: {
		addCpuData: (state, action) => {
			const { cpu, timestamp } = action.payload
			if (cpu == null || !timestamp) return

			const newLabels = [...state.data.labels, timestamp]
			const newData = [...state.data.datasets[0].data, cpu]

			if (newLabels.length > MAX_DATA_POINTS) {
				newLabels.shift()
				newData.shift()
			}

			state.data = {
				...state.data,
				labels: newLabels,
				datasets: [
					{
						...state.data.datasets[0],
						data: newData,
					},
				],
			}
			state.wsStatus = 'connected'
		},
		setWsStatus: (state, action) => {
			state.wsStatus = action.payload
		},
		clearCpuData: state => {
			state.data = {
				labels: [],
				datasets: [
					{
						label: 'Нагрузка CPU (%)',
						data: [],
						borderColor: 'rgb(0, 122, 255)',
						backgroundColor: 'rgba(0, 122, 255, 0.15)',
						tension: 0.4,
						fill: true,
						pointRadius: 0,
						pointHoverRadius: 4,
						borderWidth: 2,
					},
				],
			}
		},
	},
})

export const { addCpuData, setWsStatus, clearCpuData } = cpuSlice.actions
export default cpuSlice.reducer
