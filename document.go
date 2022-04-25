package pursuit

import (
	"fmt"
	"time"
)

// Objective for Firestore serialization/deserialization.
type Objective struct {
	Name         string                 `firestore:"name,omitempty"`
	Description  string                 `firestore:"description,omitempty"`
	Goals        map[string]Goal        `firestore:"goals,omitempty"`
	RegularGoals map[string]RegularGoal `firestore:"regular_goals,omitempty"`
	BudgetGoals  map[string]BudgetGoal  `firestore:"budget_goals,omitempty"`
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

// RegularGoal for Firestore serialization/deserialization.
type RegularGoal struct {
	Name        string     `firestore:"name,omitempty"`
	Description string     `firestore:"description,omitempty"`
	Unit        string     `firestore:"unit,omitempty"`
	Window      int64      `firestore:"window,omitempty"`
	Target      float32    `firestore:"target,omitempty"`
	Total       float32    `firestore:"total,omitempty"`
	Trajectory  Trajectory `firestore:"trajectory,omitempty"`
}

// BudgetGoal for Firestore serialization/deserialization.
type BudgetGoal struct {
	Name        string  `firestore:"name,omitempty"`
	Description string  `firestore:"description,omitempty"`
	Target      float32 `firestore:"target,omitempty"`
	Current     float32 `firestore:"current,omitempty"`
	LastUpdated int64   `firestore:"last_updated,omitempty"`
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
		return fmt.Errorf("no such goal: %q", goalID)
	}
	g.SetValue(value)
	o.Goals[goalID] = g
	return nil
}

// SetRegularGoalValue adds a new value to the trajectory of the regular goal,
// using the current timestamp.
func (o *Objective) SetRegularGoalValue(goalID string, value float32) error {
	g, ok := o.RegularGoals[goalID]
	if !ok {
		return fmt.Errorf("no such regular goal: %q", goalID)
	}
	g.SetValue(value)
	o.RegularGoals[goalID] = g
	return nil
}

// SetBudgetGoalValue sets the current value on a budget goal.
func (o *Objective) SetBudgetGoalValue(goalID string, value float32) error {
	g, ok := o.BudgetGoals[goalID]
	if !ok {
		return fmt.Errorf("no such regular goal: %q", goalID)
	}
	g.SetValue(value)
	o.BudgetGoals[goalID] = g
	return nil
}

// IncrementGoalValue adds a new value to the trajectory of the goal,
// using the current timestamp.
func (o *Objective) IncrementGoalValue(goalID string, delta float32) error {
	g, ok := o.Goals[goalID]
	if !ok {
		return fmt.Errorf("no such goal: %q", goalID)
	}
	g.IncrementValue(delta)
	o.Goals[goalID] = g
	return nil
}

// IncrementRegularGoalValue adds a new value to the trajectory of the regular goal,
// using the current timestamp.
func (o *Objective) IncrementRegularGoalValue(goalID string, delta float32) error {
	g, ok := o.RegularGoals[goalID]
	if !ok {
		return fmt.Errorf("no such regular goal: %q", goalID)
	}
	g.IncrementValue(delta)
	o.RegularGoals[goalID] = g
	return nil
}

// SetValue adds a new value to the trajectory of the goal,
// using the current timestamp.
func (g *Goal) SetValue(value float32) {
	g.Trajectory.SetValue(value)
}

// SetValue adds a new value to the trajectory of the regular goal,
// using the current timestamp.
func (g *RegularGoal) SetValue(value float32) {
	g.Trajectory.SetValue(value)
}

// SetValue sets the current value of the budget goal, as well as the
// last updated timestamp.
func (g *BudgetGoal) SetValue(value float32) {
	g.Current = value
	g.LastUpdated = time.Now().UnixNano() / 1000 / 1000
}

// SetValue adds a new value to the trajectory,
// using the current timestamp.
func (t *Trajectory) SetValue(value float32) {
	p := DateValue{
		Date:  time.Now().UnixNano() / 1000 / 1000,
		Value: value,
	}
	*t = append(*t, p)
}

// IncrementValue adds a delta to the latest value on the trajectory
// of a goal, using the current timestamp.
func (g *Goal) IncrementValue(delta float32) {
	g.Trajectory.IncrementValue(delta)
}

// IncrementValue adds a delta to the latest value on the trajectory
// of a regular goal, using the current timestamp.
func (g *RegularGoal) IncrementValue(delta float32) {
	g.Trajectory.IncrementValue(delta)
}

// IncrementValue adds a delta to the latest value on the trajectory,
// using the current timestamp.
func (t *Trajectory) IncrementValue(delta float32) {
	previous := (*t)[len(*t)-1]
	p := DateValue{
		Date:  time.Now().UnixNano() / 1000 / 1000,
		Value: previous.Value + delta,
	}
	*t = append(*t, p)
}
