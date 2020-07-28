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
        var goals = []Goal{
                Goal{
			Id: "foo",
                        Name: "Foo",
			Start: 0,
			End: 12345,
			Baseline: 200,
			Target: 1500,
			Current: 400,
                },
                Goal{
			Id: "bar",
                        Name: "Bar",
			Start: 3000,
			End: 52345,
			Baseline: -200,
			Target: 120,
			Current: 60,
                },
                Goal{
			Id: "baz",
                        Name: "Baz",
			Start: 4422,
			End: 12345,
			Baseline: 150,
			Target: -10,
			Current: 30,
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
