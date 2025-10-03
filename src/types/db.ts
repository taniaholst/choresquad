export type Household = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  emoji: string | null;
};

export type HouseholdMemberRow = {
  user_id: string;
  profiles: Profile[] | Profile | null;
};

export type ChoreAssignee = { user_id: string };

export type Recurrence =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom_weekdays"
  | "none";

export type Chore = {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  category_label: string | null;
  category_emoji: string | null;
  due_time: string | null;
  deadline_date: string | null;
  recurrence: Recurrence;
  custom_weekdays: number[] | null;
  interval: number | null;
  notify_minutes_before: number | null;
  created_by: string;
  created_at: string;
  chore_assignees?: ChoreAssignee[] | null;
};

export type ChoreOccurrence = {
  id: string;
  chore_id: string;
  due_at: string;
  status: "pending" | "done";
  completed_at: string | null;
  completed_by: string | null;
};
