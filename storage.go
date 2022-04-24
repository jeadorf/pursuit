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
	if err = objective.SetGoalValue(goalID, value); err != nil {
		return err
	}
	return s.updateGoalTrajectory(userID, objectiveID, goalID, objective.Goals[goalID].Trajectory)
}

// SetRegularGoalValue adds a new value to the trajectory of the regular goal,
// using the current timestamp.
func (s Storage) SetRegularGoalValue(userID, objectiveID, goalID string, value float32) error {
	objective, err := s.readObjective(userID, objectiveID)
	if err != nil {
		return err
	}
	if err = objective.SetRegularGoalValue(goalID, value); err != nil {
		return err
	}
	return s.updateRegularGoalTrajectory(userID, objectiveID, goalID, objective.Goals[goalID].Trajectory)
}

// SetBudgetGoalValue sets the current value of the budget goal.
func (s Storage) SetBudgetGoalValue(userID, objectiveID, goalID string, value float32) error {
	ref := s.client.Collection("users").Doc(userID).Collection("objectives").Doc(objectiveID)
	update := firestore.Update{
		Path:  fmt.Sprintf("budget_goals.%s.current", goalID),
		Value: value}
	_, err := ref.Update(s.ctx, []firestore.Update{update})
	return err
}

// IncrementGoalValue adds a new value to the trajectory of the goal,
// using the current timestamp.
func (s Storage) IncrementGoalValue(userID, objectiveID, goalID string, delta float32) error {
	objective, err := s.readObjective(userID, objectiveID)
	if err != nil {
		return err
	}
	if err = objective.IncrementGoalValue(goalID, delta); err != nil {
		return err
	}
	return s.updateGoalTrajectory(userID, objectiveID, goalID, objective.Goals[goalID].Trajectory)
}

// IncrementRegularGoalValue adds a new value to the trajectory of the regular goal,
// using the current timestamp.
func (s Storage) IncrementRegularGoalValue(userID, objectiveID, goalID string, delta float32) error {
	objective, err := s.readObjective(userID, objectiveID)
	if err != nil {
		return err
	}
	if err = objective.IncrementRegularGoalValue(goalID, delta); err != nil {
		return err
	}
	return s.updateRegularGoalTrajectory(userID, objectiveID, goalID, objective.RegularGoals[goalID].Trajectory)
}

func (s Storage) readObjective(userID string, objectiveID string) (Objective, error) {
	ref := s.client.Collection("users").Doc(userID).Collection("objectives").Doc(objectiveID)
	doc, err := ref.Get(s.ctx)
	if err != nil {
		return Objective{}, fmt.Errorf("error reading objective %q for user %q: %v", userID, objectiveID, err)
	}
	var objective Objective
	if err := doc.DataTo(&objective); err != nil {
		return Objective{}, err
	}
	return objective, nil
}

func (s Storage) updateGoalTrajectory(userID string, objectiveID string, goalID string, trajectory Trajectory) error {
	ref := s.client.Collection("users").Doc(userID).Collection("objectives").Doc(objectiveID)
	update := firestore.Update{
		Path:  fmt.Sprintf("goals.%s.trajectory", goalID),
		Value: trajectory}
	_, err := ref.Update(s.ctx, []firestore.Update{update})
	return err
}

func (s Storage) updateRegularGoalTrajectory(userID string, objectiveID string, goalID string, trajectory Trajectory) error {
	ref := s.client.Collection("users").Doc(userID).Collection("objectives").Doc(objectiveID)
	update := firestore.Update{
		Path:  fmt.Sprintf("regular_goals.%s.trajectory", goalID),
		Value: trajectory}
	_, err := ref.Update(s.ctx, []firestore.Update{update})
	return err
}
