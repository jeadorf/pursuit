package main

import (
        "fmt"
        "encoding/json"
        "log"
        "net/http"
        "os"
)

type Goal struct {
        Id string
        Name string
        Start int64
        End int64
        Baseline float64
        Target float64
        Current float64
}

func handler(w http.ResponseWriter, r *http.Request) {
        var goals = []Goal{
                Goal{
                        Name: "Foo",
                },
                Goal{
                        Name: "Bar",
                },
                Goal{
                        Name: "Baz",
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
