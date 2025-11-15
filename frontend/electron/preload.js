const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
	appInfo: {
		platform: process.platform,
		versions: process.versions,
	},

	sendCpuLoad: load => {
		const cpu = parseFloat(load)
		if (isNaN(cpu) || cpu < 0 || cpu > 100) {
			console.warn('Invalid CPU load value:', load)
			return
		}
		ipcRenderer.send('cpu-load-update', cpu)
	},

	toggleMonitoring: enabled => {
		ipcRenderer.send('monitoring-toggle', enabled)
	},

	on: (channel, callback) => {
		ipcRenderer.on(channel, callback)
	},

	// getMonitoringStatus: async () => {
	//   return await ipcRenderer.invoke('get-monitoring-status');
	// },
})

ipcRenderer.on('error', (event, error) => {
	console.error('[IPC Error]', error)
})
