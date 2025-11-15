package ws

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/RZhurakovskiy/agent/server/getmetrics"
	"github.com/RZhurakovskiy/agent/server/models"
	"github.com/gorilla/websocket"
	"github.com/shirou/gopsutil/v4/net"
)

// cpuPayload представляет структуру данных для передачи метрик CPU через WebSocket.
type cpuPayload struct {
	CPU       float64 `json:"cpu"`       // Процент использования CPU (0-100)
	Timestamp string  `json:"timestamp"` // Временная метка в формате "2006-01-02 15:04:05"
}

// memoryPayload представляет структуру данных для передачи метрик памяти через WebSocket.
type memoryPayload struct {
	MemoryUsage float64 `json:"memoryUsage"` // Процент использования памяти (0-100)
	UsedMB      uint64  `json:"usedMB"`      // Используемая память в мегабайтах
	TotalMemory uint64  `json:"totalMemory"` // Общий объем памяти в мегабайтах
	Timestamp   string  `json:"timestamp"`   // Временная метка в формате "2006-01-02 15:04:05"
}

// upgrader используется для обновления HTTP-соединения до WebSocket.
// CheckOrigin возвращает true для всех запросов (в продакшене лучше добавить проверку домена).
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// В продакшене здесь должна быть проверка разрешенных доменов
		return true
	},
	// Увеличиваем размер буфера для больших сообщений (например, списка процессов)
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

var (
	// Кэш метрик CPU для оптимизации производительности
	cpuCache cpuPayload
	// Кэш метрик памяти
	memCache memoryPayload
	// Кэш списка процессов
	procsCache []models.ProcessInfo
	// Мьютекс для безопасного доступа к кэшу из разных горутин
	cacheMutex sync.RWMutex
	// Контекст для управления жизненным циклом горутин обновления кэша
	cacheCtx    context.Context
	cacheCancel context.CancelFunc
	// Состояние мониторинга (включен/выключен)
	monitoringEnabled bool
	// Мьютекс для безопасного доступа к состоянию мониторинга
	monitoringMutex sync.RWMutex
)

// init инициализирует состояние мониторинга.
// По умолчанию мониторинг выключен - пользователь должен включить его через API.
func init() {
	// Мониторинг по умолчанию выключен
	monitoringEnabled = false
	// Контекст будет создан при включении мониторинга в SetMonitoringEnabled
}

// updateCacheLoop запускает бесконечные циклы обновления кэша метрик.
// CPU обновляется каждую секунду, память - каждые 3 секунды, процессы - каждые 5 секунд.
// Циклы проверяют состояние мониторинга и обновляют кэш только если мониторинг включен.
//
// Параметры:
//   - ctx: контекст для управления жизненным циклом горутин
func updateCacheLoop(ctx context.Context) {

	cpuTicker := time.NewTicker(1 * time.Second)
	defer cpuTicker.Stop()

	memTicker := time.NewTicker(3 * time.Second)
	defer memTicker.Stop()

	procTicker := time.NewTicker(5 * time.Second)
	defer procTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-cpuTicker.C:
			monitoringMutex.RLock()
			enabled := monitoringEnabled
			monitoringMutex.RUnlock()
			if enabled {
				updateCPUMetrics()
			}
		case <-memTicker.C:
			monitoringMutex.RLock()
			enabled := monitoringEnabled
			monitoringMutex.RUnlock()
			if enabled {
				updateMemoryMetrics()
			}
		case <-procTicker.C:
			monitoringMutex.RLock()
			enabled := monitoringEnabled
			monitoringMutex.RUnlock()
			if enabled {
				updateProcessMetrics()
			}
		}
	}
}

// updateCPUMetrics обновляет кэш метрик CPU (каждую секунду).
func updateCPUMetrics() {
	if usage, err := getmetrics.UsageCPU(100 * time.Millisecond); err == nil {
		cacheMutex.Lock()
		cpuCache = cpuPayload{
			CPU:       usage,
			Timestamp: time.Now().Format("2006-01-02 15:04:05"),
		}
		cacheMutex.Unlock()
	} else {
		log.Printf("Ошибка обновления кэша CPU: %v", err)
	}
}

// updateMemoryMetrics обновляет кэш метрик памяти (каждые 3 секунды).
func updateMemoryMetrics() {
	if usage, total, used, err := getmetrics.UsageMemory(); err == nil {
		cacheMutex.Lock()
		memCache = memoryPayload{
			MemoryUsage: usage,
			UsedMB:      used,
			TotalMemory: total,
			Timestamp:   time.Now().Format("2006-01-02 15:04:05"),
		}
		cacheMutex.Unlock()
	} else {
		log.Printf("Ошибка обновления кэша памяти: %v", err)
	}
}

// updateProcessMetrics обновляет кэш метрик процессов (каждые 5 секунд).
func updateProcessMetrics() {

	allConnections, err := net.Connections("all")
	if err != nil {
		log.Printf("Ошибка получения сетевых соединений: %v", err)
		allConnections = []net.ConnectionStat{}
	}

	if procs, err := getmetrics.UsageProcess(allConnections); err == nil {
		cacheMutex.Lock()
		procsCache = procs
		cacheMutex.Unlock()
	} else {
		log.Printf("Ошибка обновления кэша процессов: %v", err)
	}
}

// StreamCPU устанавливает WebSocket-соединение и начинает потоковую передачу
// метрик CPU клиенту. Данные отправляются каждую секунду из кэша.
//
// Параметры:
//   - w: HTTP ResponseWriter для обновления соединения до WebSocket
//   - r: HTTP Request с информацией о клиенте
func StreamCPU(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Ошибка обновления соединения до WebSocket (CPU): %v", err)
		return
	}
	defer conn.Close()

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	monitoringMutex.RLock()
	enabled := monitoringEnabled
	monitoringMutex.RUnlock()

	if enabled {

		if err := writeCPU(conn); err != nil {
			log.Printf("Ошибка отправки первого сообщения CPU: %v", err)
			return
		}
	} else {

		statusMsg := `{"monitoringEnabled":false,"message":"Мониторинг выключен"}`
		conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		if err := conn.WriteMessage(websocket.TextMessage, []byte(statusMsg)); err != nil {
			log.Printf("Ошибка отправки статуса мониторинга (CPU): %v", err)
			return
		}
	}

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if err := writeCPU(conn); err != nil {
			return
		}
	}
}

// writeCPU отправляет кэшированные метрики CPU через WebSocket-соединение.
// Проверяет состояние мониторинга перед отправкой данных.
//
// Параметры:
//   - conn: активное WebSocket-соединение
//
// Возвращает:
//   - error: ошибка при сериализации или отправке данных
func writeCPU(conn *websocket.Conn) error {

	monitoringMutex.RLock()
	enabled := monitoringEnabled
	monitoringMutex.RUnlock()

	if !enabled {

		statusMsg := `{"monitoringEnabled":false,"message":"Мониторинг выключен"}`
		conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		return conn.WriteMessage(websocket.TextMessage, []byte(statusMsg))
	}

	cacheMutex.RLock()
	data := cpuCache
	cacheMutex.RUnlock()

	if data.Timestamp == "" {
		statusMsg := `{"monitoringEnabled":true,"message":"Данные собираются...","cpu":0,"timestamp":"` + time.Now().Format("2006-01-02 15:04:05") + `"}`
		conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		return conn.WriteMessage(websocket.TextMessage, []byte(statusMsg))
	}

	b, err := json.Marshal(data)
	if err != nil {
		log.Printf("Ошибка сериализации метрик CPU: %v", err)
		return conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"Ошибка сериализации данных"}`))
	}

	conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return conn.WriteMessage(websocket.TextMessage, b)
}

// StreamMemory устанавливает WebSocket-соединение и начинает потоковую передачу
// метрик памяти клиенту. Данные отправляются каждую секунду из кэша.
//
// Параметры:
//   - w: HTTP ResponseWriter для обновления соединения до WebSocket
//   - r: HTTP Request с информацией о клиенте
func StreamMemory(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Ошибка обновления соединения до WebSocket (память): %v", err)
		return
	}
	defer conn.Close()

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	monitoringMutex.RLock()
	enabled := monitoringEnabled
	monitoringMutex.RUnlock()

	if enabled {

		if err := writeMemory(conn); err != nil {
			log.Printf("Ошибка отправки первого сообщения памяти: %v", err)
			return
		}
	} else {

		statusMsg := `{"monitoringEnabled":false,"message":"Мониторинг выключен"}`
		conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		if err := conn.WriteMessage(websocket.TextMessage, []byte(statusMsg)); err != nil {
			log.Printf("Ошибка отправки статуса мониторинга (память): %v", err)
			return
		}
	}

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if err := writeMemory(conn); err != nil {
			return
		}
	}
}

// writeMemory отправляет кэшированные метрики памяти через WebSocket-соединение.
// Проверяет состояние мониторинга перед отправкой данных.
//
// Параметры:
//   - conn: активное WebSocket-соединение
//
// Возвращает:
//   - error: ошибка при сериализации или отправке данных
func writeMemory(conn *websocket.Conn) error {

	monitoringMutex.RLock()
	enabled := monitoringEnabled
	monitoringMutex.RUnlock()

	if !enabled {

		statusMsg := `{"monitoringEnabled":false,"message":"Мониторинг выключен"}`
		conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		return conn.WriteMessage(websocket.TextMessage, []byte(statusMsg))
	}

	cacheMutex.RLock()
	data := memCache
	cacheMutex.RUnlock()

	if data.Timestamp == "" {
		statusMsg := `{"monitoringEnabled":true,"message":"Данные собираются...","memoryUsage":0,"usedMB":0,"totalMemory":0,"timestamp":"` + time.Now().Format("2006-01-02 15:04:05") + `"}`
		conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		return conn.WriteMessage(websocket.TextMessage, []byte(statusMsg))
	}

	b, err := json.Marshal(data)
	if err != nil {
		log.Printf("Ошибка сериализации метрик памяти: %v", err)
		return conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"Ошибка сериализации данных"}`))
	}

	conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return conn.WriteMessage(websocket.TextMessage, b)
}

// StreamProcesses устанавливает WebSocket-соединение и начинает потоковую передачу
// списка процессов клиенту. Данные отправляются каждую секунду из кэша.
//
// Параметры:
//   - w: HTTP ResponseWriter для обновления соединения до WebSocket
//   - r: HTTP Request с информацией о клиенте
func StreamProcesses(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Ошибка обновления соединения до WebSocket (процессы): %v", err)
		return
	}
	defer conn.Close()

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetWriteDeadline(time.Now().Add(30 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	monitoringMutex.RLock()
	enabled := monitoringEnabled
	monitoringMutex.RUnlock()

	if enabled {

		if err := writeProcesses(conn); err != nil {
			log.Printf("Ошибка отправки первого сообщения процессов: %v", err)
			return
		}
	} else {

		statusMsg := `{"monitoringEnabled":false,"message":"Мониторинг выключен"}`
		conn.SetWriteDeadline(time.Now().Add(30 * time.Second))
		if err := conn.WriteMessage(websocket.TextMessage, []byte(statusMsg)); err != nil {
			log.Printf("Ошибка отправки статуса мониторинга (процессы): %v", err)
			return
		}
	}

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if err := writeProcesses(conn); err != nil {
			return
		}
	}
}

// writeProcesses отправляет кэшированный список процессов через WebSocket-соединение.
// Проверяет состояние мониторинга перед отправкой данных.
//
// Параметры:
//   - conn: активное WebSocket-соединение
//
// Возвращает:
//   - error: ошибка при сериализации или отправке данных
func writeProcesses(conn *websocket.Conn) error {

	monitoringMutex.RLock()
	enabled := monitoringEnabled
	monitoringMutex.RUnlock()

	if !enabled {

		statusMsg := `{"monitoringEnabled":false,"message":"Мониторинг выключен"}`
		conn.SetWriteDeadline(time.Now().Add(30 * time.Second))
		return conn.WriteMessage(websocket.TextMessage, []byte(statusMsg))
	}

	cacheMutex.RLock()
	data := procsCache
	cacheMutex.RUnlock()

	b, err := json.Marshal(data)
	if err != nil {
		log.Printf("Ошибка сериализации списка процессов: %v", err)
		return conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"Ошибка сериализации данных"}`))
	}

	conn.SetWriteDeadline(time.Now().Add(30 * time.Second))
	return conn.WriteMessage(websocket.TextMessage, b)
}

// SetMonitoringEnabled устанавливает состояние мониторинга (включен/выключен).
// При включении запускает горутину обновления кэша, при выключении останавливает её.
//
// Параметры:
//   - enabled: true для включения мониторинга, false для выключения
func SetMonitoringEnabled(enabled bool) {
	monitoringMutex.Lock()
	wasEnabled := monitoringEnabled
	monitoringEnabled = enabled
	monitoringMutex.Unlock()

	if enabled && !wasEnabled {

		log.Println("Мониторинг включен: начинается сбор метрик")

		cacheCtx, cacheCancel = context.WithCancel(context.Background())
		go updateCacheLoop(cacheCtx)
	} else if !enabled && wasEnabled {

		log.Println("Мониторинг выключен: сбор метрик остановлен")
		if cacheCancel != nil {
			cacheCancel()
		}
	}
}

// GetMonitoringEnabled возвращает текущее состояние мониторинга.
//
// Возвращает:
//   - bool: true если мониторинг включен, false если выключен
func GetMonitoringEnabled() bool {
	monitoringMutex.RLock()
	defer monitoringMutex.RUnlock()
	return monitoringEnabled
}
