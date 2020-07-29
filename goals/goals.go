package main

import (
        "fmt"
        "encoding/json"
        "log"
        "net/http"
        "os"
)

type Goal struct {
        Id string               `json:"id"`
        Name string             `json:"name"`
        Start int64             `json:"start"`
        End int64               `json:"end"`
        Baseline float64        `json:"baseline"`
        Target float64          `json:"target"`
        Current float64         `json:"current"`
}

func handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
        var goals = []Goal{
                Goal{
			Id: "running-distance-2020",
			Name: "Running: distance (2020)",
			Start: 1577833200000,
			End: 1609369200000,
			Baseline: 0,
			Target: 750,
			Current: 415,
                },
                Goal{
			Id: "running-elevation-gain-2020",
			Name: "Running: elevation gain (2020)",
			Start: 1577833200000,
			End: 1609369200000,
			Baseline: 0,
			Target: 24000,
			Current: 15393,
                },
                Goal{
			Id: "french-vocab-2020",
			Name: "French: vocabulary size (2020)",
			Start: 1577833200000,
			End: 1609369200000,
			Baseline: 0,
			Target: 4000,
			Current: 902,
                },
        }

        json, err := json.Marshal(goals)
        if err != nil {
          http.Error(w, err.Error(), 500)
          return
        }
        fmt.Fprintf(w, string(json))
}

func main() {
        http.HandleFunc("/", handler)

        port := os.Getenv("PORT")
        if port == "" {
                port = "8080"
        }

        log.Printf("pursuit: listening on port %s", port)
        log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
