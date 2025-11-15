package api

import (
	"net/http"

	"github.com/RZhurakovskiy/agent/server/handlers"
	"github.com/RZhurakovskiy/agent/server/ws"
)

func SetupRoutes(mux *http.ServeMux) {

	mux.HandleFunc("/api/gethostusername", handlers.GetHostUserName)
	mux.HandleFunc("/api/kill-process-by-id", handlers.KillProcessById)
	mux.HandleFunc("/api/get-host-username", handlers.GetHostUserName)

	mux.HandleFunc("/api/get-device-info", handlers.GetDeviceInfo)

	mux.HandleFunc("/api/listening-ports", handlers.GetListeningPort)

	mux.HandleFunc("/api/start-processes", handlers.StartProcess)

	mux.HandleFunc("/api/monitoring-status", func(writer http.ResponseWriter, request *http.Request) {
		switch request.Method {
		case http.MethodGet:
			handlers.GetMonitoringStatus(writer, request)
		case http.MethodPost:
			handlers.SetMonitoringStatus(writer, request)
		default:
			http.Error(writer, "Метод не разрешён. Используйте GET или POST", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/ws/cpu", ws.StreamCPU)
	mux.HandleFunc("/ws/memory", ws.StreamMemory)
	mux.HandleFunc("/ws/processes", ws.StreamProcesses)
}
