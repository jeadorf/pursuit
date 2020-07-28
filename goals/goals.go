package main

import (
        "fmt"
        "log"
        "net/http"
        "os"
)

func handler(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello %s!\n", target)
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
