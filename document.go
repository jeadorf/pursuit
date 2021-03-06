package pursuit

import (
	"fmt"
	"time"
)

// Objective for Firestore serialization/deserialization.
type Objective struct {
	Name        string          `firestore:"name,omitempty"`
	Description string          `firestore:"description,omitempty"`
	Goals       map[string]Goal `firestore:"goals,omitempty"`
}

// Goal for Firestore serialization/deserialization.
type Goal struct {
	Name       string     `firestore:"name,omitempty"`
	Stage      string     `firestore:"stage,omitempty"`
	Start      int64      `firestore:"start,omitempty"`
	End        int64      `firestore:"end,omitempty"`
	Target     float32    `firestore:"target,omitempty"`
	Unit       string     `firestore:"unit,omitempty"`
	Trajectory Trajectory `firestore:"trajectory,omitempty"`
}

// Trajectory for Firestore serialization/deserialization.
type Trajectory []DateValue

// DateValue for Firestore serialization/deserialization.
type DateValue struct {
	Date  int64   `firestore:"date"`
	Value float32 `firestore:"value"`
}

// SetGoalValue adds a new value to the trajectory of the goal,
// using the current timestamp.
func (o *Objective) SetGoalValue(goalID string, value float32) error {
	g, ok := o.Goals[goalID]
	if !ok {
		return fmt.Errorf("No such goal: %q", goalID)
	}
	g.SetValue(value)
	o.Goals[goalID] = g
	return nil
}

// IncrementGoalValue adds a new value to the trajectory of the goal,
// using the current timestamp.
func (o *Objective) IncrementGoalValue(goalID string, delta float32) error {
	g, ok := o.Goals[goalID]
	if !ok {
		return fmt.Errorf("No such goal: %q", goalID)
	}
	g.IncrementValue(delta)
	o.Goals[goalID] = g
	return nil
}

// SetValue adds a new value to the trajectory of the goal,
// using the current timestamp.
func (g *Goal) SetValue(value float32) {
	p := DateValue{
		Date:  time.Now().UnixNano() / 1000 / 1000,
		Value: value,
	}
	g.Trajectory = append(g.Trajectory, p)
}

// IncrementValue adds a delta to the latest value on the trajectory
// of a goal, using the current timestamp.
func (g *Goal) IncrementValue(delta float32) {
	previous := g.Trajectory[len(g.Trajectory)-1]
	p := DateValue{
		Date:  time.Now().UnixNano() / 1000 / 1000,
		Value: previous.Value + delta,
	}
	g.Trajectory = append(g.Trajectory, p)
}
