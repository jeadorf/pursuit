package pursuit

import (
	"testing"
)

func TestUpdateGoal(t *testing.T) {
	g := Goal{}

	g.SetValue(123)
	g.SetValue(456)

	if g.Trajectory[1].Value != 456 {
		t.Errorf("last entry was %f; wanted 456", g.Trajectory[1].Value)
	}
}

func TestUpdateRegularGoal(t *testing.T) {
	g := RegularGoal{}

	g.SetValue(123)
	g.SetValue(456)

	if g.Trajectory[1].Value != 456 {
		t.Errorf("last entry was %f; wanted 456", g.Trajectory[1].Value)
	}
}

func TestIncrementGoal(t *testing.T) {
	g := Goal{}

	g.SetValue(123)
	g.IncrementValue(5)

	if g.Trajectory[1].Value != 128 {
		t.Errorf("last entry was %f; wanted 128", g.Trajectory[1].Value)
	}
}

func TestIncrementRegularGoal(t *testing.T) {
	g := RegularGoal{}

	g.SetValue(123)
	g.IncrementValue(5)

	if g.Trajectory[1].Value != 128 {
		t.Errorf("last entry was %f; wanted 128", g.Trajectory[1].Value)
	}
}

func TestIncrementNegativeGoal(t *testing.T) {
	g := Goal{}

	g.SetValue(123)
	g.IncrementValue(-5)

	if g.Trajectory[1].Value != 118 {
		t.Errorf("last entry was %f; wanted 118", g.Trajectory[1].Value)
	}
}

func TestIncrementNegativeRegularGoal(t *testing.T) {
	g := RegularGoal{}

	g.SetValue(123)
	g.IncrementValue(-5)

	if g.Trajectory[1].Value != 118 {
		t.Errorf("last entry was %f; wanted 118", g.Trajectory[1].Value)
	}
}

func TestSetGoalValue(t *testing.T) {
	o := Objective{
		Goals: map[string]Goal{},
	}
	o.Goals["abc"] = Goal{}

	o.SetGoalValue("abc", 123)
	o.SetGoalValue("abc", 456)

	if o.Goals["abc"].Trajectory[1].Value != 456 {
		t.Errorf("last entry was %f; wanted 456", o.Goals["abc"].Trajectory[1].Value)
	}
}

func TestSetRegularGoalValue(t *testing.T) {
	o := Objective{
		RegularGoals: map[string]RegularGoal{},
	}
	o.RegularGoals["abc"] = RegularGoal{}

	o.SetRegularGoalValue("abc", 123)
	o.SetRegularGoalValue("abc", 456)

	if o.RegularGoals["abc"].Trajectory[1].Value != 456 {
		t.Errorf("last entry was %f; wanted 456", o.RegularGoals["abc"].Trajectory[1].Value)
	}
}

func TestSetGoalValueNotExists(t *testing.T) {
	o := Objective{
		Goals: map[string]Goal{},
	}

	err := o.SetGoalValue("abc", 123)

	if err == nil {
		t.Errorf("wanted error, got none")
	}
}

func TestSetRegularGoalValueNotExists(t *testing.T) {
	o := Objective{
		RegularGoals: map[string]RegularGoal{},
	}

	err := o.SetRegularGoalValue("abc", 123)

	if err == nil {
		t.Errorf("wanted error, got none")
	}
}

func TestIncrementGoalValue(t *testing.T) {
	o := Objective{
		Goals: map[string]Goal{},
	}
	o.Goals["abc"] = Goal{}

	o.SetGoalValue("abc", 123)
	o.IncrementGoalValue("abc", 5)

	if o.Goals["abc"].Trajectory[1].Value != 128 {
		t.Errorf("last entry was %f; wanted 128", o.Goals["abc"].Trajectory[1].Value)
	}
}

func TestIncrementRegularGoalValue(t *testing.T) {
	o := Objective{
		RegularGoals: map[string]RegularGoal{},
	}
	o.RegularGoals["abc"] = RegularGoal{}

	o.SetRegularGoalValue("abc", 123)
	o.IncrementRegularGoalValue("abc", 5)

	if o.RegularGoals["abc"].Trajectory[1].Value != 128 {
		t.Errorf("last entry was %f; wanted 128", o.RegularGoals["abc"].Trajectory[1].Value)
	}
}

func TestIncrementGoalValueNotExists(t *testing.T) {
	o := Objective{
		Goals: map[string]Goal{},
	}

	err := o.IncrementGoalValue("abc", 123)

	if err == nil {
		t.Errorf("wanted error, got none")
	}
}

func TestIncrementRegularGoalValueNotExists(t *testing.T) {
	o := Objective{
		RegularGoals: map[string]RegularGoal{},
	}

	err := o.IncrementRegularGoalValue("abc", 123)

	if err == nil {
		t.Errorf("wanted error, got none")
	}
}
