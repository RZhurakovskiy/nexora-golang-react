import { createSlice } from '@reduxjs/toolkit'

const MAX_DATA_POINTS = 60

const initialState = {
	data: {
		labels: [],
		datasets: [
			{
				label: 'Использование ОЗУ (%)',
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
	samples: [],
	latestSample: null,
	wsStatus: 'disconnected',
}

const memorySlice = createSlice({
	name: 'memory',
	initialState,
	reducers: {
		addMemoryData: (state, action) => {
			const { memoryUsage, usedMB, totalMemory, timestamp } = action.payload

			const memoryPercent = Number(memoryUsage)
			const used = Number(usedMB || 0)
			const total = Number(totalMemory || 0)

			if (!timestamp || Number.isNaN(memoryPercent)) return

			const sample = {
				timestamp,
				percent: memoryPercent,
				usedMB: used,
				totalMemoryMB: total,
			}

			const updatedSamples = [...state.samples, sample]
			if (updatedSamples.length > MAX_DATA_POINTS) {
				updatedSamples.shift()
			}

			const newLabels = [...state.data.labels, timestamp]
			const newData = [...state.data.datasets[0].data, memoryPercent]

			if (newLabels.length > MAX_DATA_POINTS) {
				newLabels.shift()
				newData.shift()
			}

			state.samples = updatedSamples
			state.latestSample = sample
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
		clearMemoryData: state => {
			state.data = {
				labels: [],
				datasets: [
					{
						label: 'Использование ОЗУ (%)',
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
			state.samples = []
			state.latestSample = null
		},
	},
})

export const { addMemoryData, setWsStatus, clearMemoryData } =
	memorySlice.actions
export default memorySlice.reducer
