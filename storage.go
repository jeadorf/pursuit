package pursuit

import (
	"context"
	"fmt"
	"log"

	"cloud.google.com/go/firestore"

	firebase "firebase.google.com/go"
)

// Storage provides an interface to serialization/deserialization of
// objectives in Firestore.
type Storage struct {
	client *firestore.Client
	ctx    context.Context
}

// NewStorage creates client for a particular project.
func NewStorage(projectID string) *Storage {
	ctx := context.Background()
	conf := &firebase.Config{ProjectID: projectID}
	app, err := firebase.NewApp(ctx, conf)
	if err != nil {
		log.Fatalln(err)
	}
	client, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalln(err)
	}
	return &Storage{client, ctx}
}

// SetGoalValue adds a new value to the trajectory of the goal,
// using the current timestamp.
func (s Storage) SetGoalValue(userID, objectiveID, goalID string, value float32) error {
	objective, err := s.readObjective(userID, objectiveID)
	if err != nil {
		return err
	}
	objective.SetGoalValue(goalID, value)
	return s.writeObjective(userID, objectiveID, objective)
}

// SetRegularGoalValue adds a new value to the trajectory of the regular goal,
// using the current timestamp.
func (s Storage) SetRegularGoalValue(userID, objectiveID, goalID string, value float32) error {
	objective, err := s.readObjective(userID, objectiveID)
	if err != nil {
		return err
	}
	objective.SetRegularGoalValue(goalID, value)
	return s.writeObjective(userID, objectiveID, objective)
}

// IncrementGoalValue adds a new value to the trajectory of the goal,
// using the current timestamp.
func (s Storage) IncrementGoalValue(userID, objectiveID, goalID string, delta float32) error {
	objective, err := s.readObjective(userID, objectiveID)
	if err != nil {
		return err
	}
	objective.IncrementGoalValue(goalID, delta)
	return s.writeObjective(userID, objectiveID, objective)
}

// IncrementRegularGoalValue adds a new value to the trajectory of the regular goal,
// using the current timestamp.
func (s Storage) IncrementRegularGoalValue(userID, objectiveID, goalID string, delta float32) error {
	objective, err := s.readObjective(userID, objectiveID)
	if err != nil {
		return err
	}
	objective.IncrementRegularGoalValue(goalID, delta)
	return s.writeObjective(userID, objectiveID, objective)
}

func (s Storage) readObjective(userID string, objectiveID string) (Objective, error) {
	ref := s.client.Collection("users").Doc(userID).Collection("objectives").Doc(objectiveID)
	doc, err := ref.Get(s.ctx)
	if err != nil {
		return Objective{}, fmt.Errorf("Error reading objective: %v", err)
	}
	var objective Objective
	doc.DataTo(&objective)
	return objective, nil
}

func (s Storage) writeObjective(userID string, objectiveID string, objective Objective) error {
	ref := s.client.Collection("users").Doc(userID).Collection("objectives").Doc(objectiveID)
	_, err := ref.Set(s.ctx, objective)
	return err
}
