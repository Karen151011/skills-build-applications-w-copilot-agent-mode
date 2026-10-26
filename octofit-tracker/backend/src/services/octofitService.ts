import { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity data must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !isValidObjectId(userId) ||
    typeof teamId !== 'string' || !isValidObjectId(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Activity data is invalid'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team data must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !isValidObjectId(member))
  ) {
    throw Object.assign(new Error('Team data is invalid'), { status: 400 });
  }

  const memberIds = [...new Set(members as string[])];
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) {
      throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
    }
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('_id fitnessGoal').lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const activities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean();
  const focusByActivity = (type: string) => {
    const normalizedType = type.trim().toLowerCase();
    if (['run', 'running', 'cycle', 'cycling', 'swim', 'swimming'].includes(normalizedType)) return 'endurance';
    if (['strength', 'weightlifting', 'weights'].includes(normalizedType)) return 'strength';
    return normalizedType;
  };
  const focusCounts = new Map<string, number>();
  for (const activity of activities) {
    const focus = focusByActivity(activity.type);
    focusCounts.set(focus, (focusCounts.get(focus) ?? 0) + 1);
  }

  const preferredFocus = [...focusCounts.entries()]
    .sort(([focusA, countA], [focusB, countB]) =>
      countB - countA ||
      Number(focusB === user.fitnessGoal) - Number(focusA === user.fitnessGoal),
    )[0]?.[0] ?? user.fitnessGoal;
  const reason = activities.length > 0
    ? `Recommended because your ${activities[0].type} activity matches ${preferredFocus}.`
    : `Recommended to support your ${preferredFocus} fitness goal.`;
  const workouts = await Workout.find({ focus: preferredFocus }).lean();

  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
