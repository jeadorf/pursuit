package document

import (
	"testing"
)

func TestUpdate(t *testing.T) {
	g := Goal{}

	g.Update(123)
	g.Update(456)

	if g.Trajectory[1].Value != 456 {
		t.Errorf("last entry was %f; wanted 456", g.Trajectory[1].Value)
	}
}

func TestIncrement(t *testing.T) {
	g := Goal{}

	g.Update(123)
	g.Increment(5)

	if g.Trajectory[1].Value != 128 {
		t.Errorf("last entry was %f; wanted 128", g.Trajectory[1].Value)
	}
}

func TestIncrementNegative(t *testing.T) {
	g := Goal{}

	g.Update(123)
	g.Increment(-5)

	if g.Trajectory[1].Value != 118 {
		t.Errorf("last entry was %f; wanted 118", g.Trajectory[1].Value)
	}
}

func TestUpdateGoal(t *testing.T) {
	o := Objective{
		Goals: map[string]Goal{},
	}
	o.Goals["abc"] = Goal{}

	o.UpdateGoal("abc", 123)
	o.UpdateGoal("abc", 456)

	if o.Goals["abc"].Trajectory[1].Value != 456 {
		t.Errorf("last entry was %f; wanted 456", o.Goals["abc"].Trajectory[1].Value)
	}
}

func TestUpdateGoalNotExists(t *testing.T) {
	o := Objective{
		Goals: map[string]Goal{},
	}

	err := o.UpdateGoal("abc", 123)

	if err == nil {
		t.Errorf("wanted error, got none")
	}
}

func TestIncrementGoal(t *testing.T) {
	o := Objective{
		Goals: map[string]Goal{},
	}
	o.Goals["abc"] = Goal{}

	o.UpdateGoal("abc", 123)
	o.IncrementGoal("abc", 5)

	if o.Goals["abc"].Trajectory[1].Value != 128 {
		t.Errorf("last entry was %f; wanted 128", o.Goals["abc"].Trajectory[1].Value)
	}
}

func TestIncrementGoalNotExists(t *testing.T) {
	o := Objective{
		Goals: map[string]Goal{},
	}

	err := o.IncrementGoal("abc", 123)

	if err == nil {
		t.Errorf("wanted error, got none")
	}
}
