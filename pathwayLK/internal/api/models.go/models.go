package modelsgo

import "time"

type ErrorResponse struct {
	Success   bool      `json:"success"`
	Error     string    `json:"error"`
	RequestID string    `json:"request_id"`
	Timestamp time.Time `json:"timestamp"`
}
