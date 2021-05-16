package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/jeadorf/pursuit/document"
	"log"
	"net/http"
	"os"

	"cloud.google.com/go/firestore"

	firebase "firebase.google.com/go"
)

var client *firestore.Client
var ctx context.Context

func init() {
	projectID := "pursuit-284716"
	ctx = context.Background()
	conf := &firebase.Config{ProjectID: projectID}
	app, err := firebase.NewApp(ctx, conf)
	if err != nil {
		log.Fatalln(err)
	}

	client, err = app.Firestore(ctx)
	if err != nil {
		log.Fatalln(err)
	}
}

type setGoalValueRequest struct {
	User      string  `json:"user"`
	Objective string  `json:"objective"`
	Goal      string  `json:"goal"`
	Value     float32 `json:"value"`
}

func setGoalValue(w http.ResponseWriter, r *http.Request) {
	p := setGoalValueRequest{}

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Error parsing request", http.StatusBadRequest)
		return
	}

	if p.User == "" {
		http.Error(w, "missing 'goal' parameter", http.StatusBadRequest)
		return
	}

	if p.Objective == "" {
		http.Error(w, "missing 'objective' parameter", http.StatusBadRequest)
		return
	}

	if p.Goal == "" {
		http.Error(w, "missing 'goal' parameter", http.StatusBadRequest)
		return
	}

	ref := client.Collection("users").Doc(p.User).Collection("objectives").Doc(p.Objective)
	doc, err := ref.Get(ctx)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error reading value: %v", err), http.StatusServiceUnavailable)
		return
	}

	var objective document.Objective
	doc.DataTo(&objective)

	objective.UpdateGoal(p.Goal, p.Value)

	_, err = ref.Set(ctx, objective)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error writing value: %v", err), http.StatusServiceUnavailable)
		return
	}
}

func main() {
	log.Print("starting server...")
	http.HandleFunc("/setgoalvalue", setGoalValue)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Printf("defaulting to port %s", port)
	}

	log.Printf("listening on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
