/*
Package models содержит структуры данных для API-ответов и бизнес-логики сервера.
- Все модели используются для сериализации данных в JSON при взаимодействии с клиентом.
*/
package models

/*
ProcessInfo представляет информацию о системном процессе.
- Используется для передачи данных о процессах через API и WebSocket.
*/
type ProcessInfo struct {
	PID           int32    `json:"pid"`
	Name          string   `json:"name"`
	Exe           string   `json:"exe"`
	Cmdline       string   `json:"cmdline"`
	Username      string   `json:"username"`
	Status        string   `json:"status"`
	CreateTime    int64    `json:"createTime"`
	ParentPID     int32    `json:"parentPid"`
	CPUPercent    float64  `json:"cpuPercent"`
	MemoryPercent float64  `json:"memoryPercent"`
	MemoryRSS     uint64   `json:"memoryRss"`
	Ports         []uint32 `json:"ports"`
}

/*
CPUMetricsResponse представляет метрики использования CPU.
- Используется для передачи данных через WebSocket /ws/cpu.
*/
type CPUMetricsResponse struct {
	CPU       float64 `json:"cpu"`
	Timestamp string  `json:"timestamp"`
}

/*
MemoryMetricsResponse представляет метрики использования памяти.
- Используется для передачи данных через WebSocket /ws/memory.
*/
type MemoryMetricsResponse struct {
	MemoryUsage float64 `json:"memory"`
	UsedMB      uint64  `json:"usedMB"`
	TotalMemory uint64  `json:"totalmemory"`
	Timestamp   string  `json:"timestamp"`
}

/*
KillProcessByID представляет ответ API при попытке завершить процесс.
- Используется в HTTP-эндпоинте /api/kill-process-by-id.
*/
type KillProcessByID struct {
	PID       int32  `json:"pid"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}

/*
MonitoringStatusRequest представляет запрос на изменение состояния мониторинга.
- Используется в HTTP-эндпоинте /api/monitoring-status.
*/
type MonitoringStatusRequest struct {
	Enabled bool `json:"enabled"`
}

/*
MonitoringStatusResponse представляет ответ API о состоянии мониторинга.
- Используется в HTTP-эндпоинте /api/monitoring-status.
*/
type MonitoringStatusResponse struct {
	Enabled   bool   `json:"enabled"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}

/*
ListeningPort представляет ответ API о состоянии наличии LISTEN tcp портов.
- Используется в HTTP-эндпоинте /api/istening-ports.
*/
type ListeningPort struct {
	Port       uint32 `json:"port"`
	Protocol   string `json:"protocol"`
	PID        int32  `json:"pid"`
	Process    string `json:"process"`
	Status     string `json:"status"`
	LocalAddr  string `json:"localAddr"`
	RemoteAddr string `json:"remoteAddr"`
}

type StartProcessRequest struct {
	Command   string `json:"command"`
	Args      string `json:"args"`
	Cwd       string `json:"cwd"`
	Timestamp string `json:"timestamp"`
}
type StartProcessResponse struct {
	PID     int32  `json:"pid"`
	Command string `json:"command"`
	Args    string `json:"args"`
	Cwd     string `json:"cwd"`
	Msg     string `json:"msg"`
}
