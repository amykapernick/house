export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Activity = {
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  sources: Array<Scalars['String']['output']>;
  status: MilestoneStatus;
  title: Scalars['String']['output'];
};

export type AddRecipesToShoppingListResult = {
  success: Scalars['Boolean']['output'];
};

export type Alert = {
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  level: AlertType;
  title: Scalars['String']['output'];
};

export type AlertOrderBy =
  | 'urgency';

export type AlertType =
  | 'info'
  | 'ok'
  | 'urgent'
  | 'warn';

export type Allergen = {
  daysUntilDue: Maybe<Scalars['Int']['output']>;
  due: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isRecurring: Scalars['Boolean']['output'];
  link: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  urgency: Maybe<AllergenUrgency>;
};

export type AllergenUrgency =
  | 'upcoming'
  | 'urgent';

export type Area = {
  colour: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  info: Maybe<Array<Maybe<Info>>>;
  items: Maybe<Array<Maybe<Item>>>;
  link: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  size: Array<Scalars['Float']['output']>;
  start: Array<Scalars['Float']['output']>;
};

export type Auslan = {
  check_frequency: Scalars['Int']['output'];
  last_updated: Scalars['String']['output'];
  note: Scalars['String']['output'];
  signs: Array<AuslanSign>;
  sources: Array<Scalars['String']['output']>;
};

export type AuslanSign = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  reference: Maybe<SignbankWord>;
  status: SignStatus;
  tip: Scalars['String']['output'];
};

export type AvailableHouseEntity = {
  entityId: Scalars['String']['output'];
  friendlyName: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  suggestedArea: Maybe<Scalars['ID']['output']>;
  suggestedType: Maybe<ItemType>;
};

export type BedroomTempPattern = {
  bedtime_temp_c: Scalars['Float']['output'];
  early_morning_temp_c: Scalars['Float']['output'];
  swing_note: Scalars['String']['output'];
};

export type BudgetBucket = {
  id: Maybe<Scalars['String']['output']>;
  items: Maybe<Array<Maybe<BudgetItem>>>;
  name: Maybe<Scalars['String']['output']>;
  percentage: Maybe<Scalars['Float']['output']>;
  percentageGoal: Maybe<Scalars['Float']['output']>;
};

export type BudgetItem = {
  amount: Maybe<Scalars['Float']['output']>;
  bucket: Maybe<BudgetBucket>;
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  income: Maybe<Scalars['Boolean']['output']>;
  monthlyAmount: Maybe<Scalars['Float']['output']>;
  note: Maybe<Scalars['String']['output']>;
  period: Maybe<Scalars['String']['output']>;
  tags: Maybe<Scalars['String']['output']>;
};

export type BudgetItemInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  bucket?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  income?: InputMaybe<Scalars['Boolean']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  period?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Scalars['String']['input']>;
};

export type BudgetMutationResult = {
  id: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type Calendar = {
  colour: Maybe<Scalars['String']['output']>;
  family: Maybe<Array<Maybe<User>>>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

export type CarSeat = {
  check_frequency: Scalars['Int']['output'];
  current_stage: Scalars['String']['output'];
  facing: Scalars['String']['output'];
  facing_note: Scalars['String']['output'];
  last_updated: Scalars['String']['output'];
  name: Scalars['String']['output'];
  next_transition: Scalars['String']['output'];
  sources: Array<Scalars['String']['output']>;
};

export type CheckShoppingItemResult = {
  success: Scalars['Boolean']['output'];
};

export type Clothing = {
  daytime: ClothingDaytime;
  seasonal: ClothingSeasonal;
};

export type ClothingDaytime = {
  current_recommendation: CurrentClothingRecommendation;
  feet_rule: Scalars['String']['output'];
  forecast: Array<DayForecast>;
  indoor_reference: Array<IndoorClothingRef>;
  layer_rule: Scalars['String']['output'];
  note: Scalars['String']['output'];
  outdoor_reference: Array<OutdoorClothingRef>;
  rain_suit: RainSuit;
  sun_safety: SunSafety;
};

export type ClothingExtras = {
  beanie: Maybe<Scalars['Boolean']['output']>;
  hat: Maybe<Scalars['Boolean']['output']>;
  hat_reason: Maybe<Scalars['String']['output']>;
  mittens: Maybe<Scalars['Boolean']['output']>;
  sunscreen: Maybe<Scalars['Boolean']['output']>;
  sunscreen_reason: Maybe<Scalars['String']['output']>;
};

export type ClothingLayer = {
  material: Material;
  position: LayerPosition;
  sleeve: SleeveLength;
  type: ClothingType;
  weight: LayerWeight;
};

export type ClothingSeasonal = {
  alerts: Array<SeasonalAlert>;
  current_sizes: Array<Scalars['String']['output']>;
  current_sizes_note: Scalars['String']['output'];
  noongar_season: NoonarSeason;
  note: Scalars['String']['output'];
};

export type ClothingSet = {
  extras: Maybe<ClothingExtras>;
  feet: Maybe<FeetRecommendation>;
  layers: Array<ClothingLayer>;
  rain_suit: Maybe<Scalars['Boolean']['output']>;
  summary: Maybe<Scalars['String']['output']>;
};

export type ClothingType =
  | 'bodysuit'
  | 'fleece'
  | 'jacket'
  | 'knit'
  | 'onesie'
  | 'rainsuit'
  | 'tshirt'
  | 'vest';

export type CompleteTaskResult = {
  success: Scalars['Boolean']['output'];
};

export type ContentEntry = {
  icon: Maybe<Scalars['String']['output']>;
  iconType: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type ContentGroup = {
  description: Maybe<Scalars['String']['output']>;
  pages: Maybe<Array<Maybe<ContentPageLink>>>;
  title: Maybe<Scalars['String']['output']>;
};

export type ContentPage = {
  content: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type ContentPageLink = {
  sectionCount: Maybe<Scalars['Int']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type CreateShoppingItemResult = {
  item: Maybe<ShoppingItem>;
  success: Scalars['Boolean']['output'];
};

export type CreateTaskResult = {
  success: Scalars['Boolean']['output'];
  task: Maybe<Task>;
};

export type CurrentClothingRecommendation = {
  generated_from_feels_like_c: Maybe<Scalars['Float']['output']>;
  generated_from_temp_c: Maybe<Scalars['Float']['output']>;
  indoor: ClothingSet;
  last_updated: Maybe<Scalars['String']['output']>;
  outdoor: ClothingSet;
};

export type DateRange = {
  end: Maybe<Scalars['String']['output']>;
  start: Maybe<Scalars['String']['output']>;
};

export type DayForecast = {
  conditions: Scalars['String']['output'];
  date: Scalars['String']['output'];
  day_label: Scalars['String']['output'];
  feels_like_high_c: Scalars['Float']['output'];
  feels_like_low_c: Scalars['Float']['output'];
  indoor: ClothingSet;
  outdoor: ClothingSet;
  rain_expected: Scalars['Boolean']['output'];
  temp_high_c: Scalars['Float']['output'];
  temp_low_c: Scalars['Float']['output'];
  uv_index: Scalars['Float']['output'];
};

export type DentalCare = {
  note: Scalars['String']['output'];
  sources: Array<Scalars['String']['output']>;
  todoist_task: Maybe<Task>;
  toothbrush: Scalars['String']['output'];
  toothpaste: Scalars['String']['output'];
};

export type Event = {
  cfp: Maybe<EventDateRange>;
  dates: Maybe<EventDateRange>;
  id: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  status: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

export type EventDateRange = {
  end: Maybe<Scalars['String']['output']>;
  start: Maybe<Scalars['String']['output']>;
};

export type Feeding = {
  check_frequency: Scalars['Int']['output'];
  details: Array<LabelValue>;
  last_updated: Scalars['String']['output'];
  principles: FoodPrinciples;
  schedule: FeedingSchedule;
  sources: Array<Scalars['String']['output']>;
};

export type FeedingSchedule = {
  note: Scalars['String']['output'];
  source: Scalars['String']['output'];
  stages: Array<FeedingStage>;
  upcoming: Array<Scalars['String']['output']>;
};

export type FeedingStage = {
  breastfeeds: ValueNote;
  expected_age: Array<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  solid_meals: ValueNote;
  title: Scalars['String']['output'];
  upcoming: Scalars['String']['output'];
  water: ValueNote;
};

export type FeetRecommendation =
  | 'bare'
  | 'shoes'
  | 'socks';

export type FoodPrincipleItem = {
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  sources: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
};

export type FoodPrinciples = {
  core_philosophy: Scalars['String']['output'];
  current_and_ongoing: Array<FoodPrincipleItem>;
  note: Scalars['String']['output'];
  sources: Array<Scalars['String']['output']>;
  toddler_forward_look: Array<FoodPrincipleItem>;
};

export type Growth = {
  check_frequency: Scalars['Int']['output'];
  last_updated: Scalars['String']['output'];
  measurements: Array<GrowthMeasurement>;
  note: Scalars['String']['output'];
  trend_notes: Scalars['String']['output'];
};

export type GrowthMeasurement = {
  date: Scalars['String']['output'];
  head: Measurement;
  height: Measurement;
  weight: Measurement;
};

export type Habit = {
  assigned: Array<User>;
  completions: Array<Scalars['String']['output']>;
  due: Maybe<Scalars['String']['output']>;
  frequency: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  lastCompleted: Maybe<Scalars['String']['output']>;
  link: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  recurrence: Maybe<Scalars['String']['output']>;
  streak: Maybe<Scalars['Int']['output']>;
};

export type HomeAssistantState = {
  entityId: Scalars['ID']['output'];
  friendlyName: Maybe<Scalars['String']['output']>;
  lastChanged: Maybe<Scalars['String']['output']>;
  lastUpdated: Maybe<Scalars['String']['output']>;
  state: Scalars['String']['output'];
  unitOfMeasurement: Maybe<Scalars['String']['output']>;
};

export type HouseAreaInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  size?: InputMaybe<Array<Scalars['Float']['input']>>;
  start?: InputMaybe<Array<Scalars['Float']['input']>>;
};

export type HouseItemInput = {
  area?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  linkedItem?: InputMaybe<Scalars['String']['input']>;
  rotation?: InputMaybe<Scalars['Float']['input']>;
  size?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  start?: InputMaybe<Array<Scalars['Float']['input']>>;
  type?: InputMaybe<ItemType>;
};

export type HouseMutationResult = {
  id: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type IcsEvent = {
  allDay: Maybe<Scalars['Boolean']['output']>;
  colour: Maybe<Scalars['String']['output']>;
  dates: Maybe<IcsEventDateRange>;
  family: Maybe<Array<Maybe<User>>>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
};

export type IcsEventDateRange = {
  end: Maybe<Scalars['String']['output']>;
  start: Maybe<Scalars['String']['output']>;
};

export type IndoorClothingRef = {
  indoor_temp_c_max: Maybe<Scalars['Float']['output']>;
  indoor_temp_c_min: Maybe<Scalars['Float']['output']>;
  layers: Scalars['Int']['output'];
  recommendation: Scalars['String']['output'];
};

export type Info = {
  area: Maybe<Area>;
  type: InfoType;
  value: Scalars['Float']['output'];
};

export type InfoType =
  | 'humidity'
  | 'temperature';

export type Item = {
  area: Maybe<Area>;
  id: Scalars['ID']['output'];
  link: Maybe<Scalars['String']['output']>;
  linkedItem: Maybe<Item>;
  rotation: Maybe<Scalars['Float']['output']>;
  size: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  start: Array<Scalars['Float']['output']>;
  state: Maybe<Array<Maybe<ItemStateAdvanced>>>;
  type: ItemType;
};

export type ItemState =
  | 'error'
  | 'off'
  | 'on';

export type ItemStateAdvanced = {
  state: ItemState;
  type: Maybe<ItemType>;
};

export type ItemType =
  | 'aircon'
  | 'alarm'
  | 'bed'
  | 'camera'
  | 'computer'
  | 'doorbell'
  | 'fan'
  | 'fan_light'
  | 'fan_pedestol'
  | 'fire'
  | 'fridge'
  | 'lamp'
  | 'laptop'
  | 'light'
  | 'light_switch'
  | 'monitor'
  | 'oven'
  | 'pi'
  | 'robot_vacuum'
  | 'speaker'
  | 'tv'
  | 'washing_machine'
  | 'wifi_router';

export type LabelValue = {
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type LayerPosition =
  | 'base'
  | 'mid'
  | 'outer';

export type LayerWeight =
  | 'heavy'
  | 'light'
  | 'mid';

export type Material =
  | 'cotton'
  | 'cotton_knit'
  | 'fleece'
  | 'merino'
  | 'softshell'
  | 'waterproof';

export type MealPlanDay = {
  date: Scalars['String']['output'];
  entries: Array<MealPlanEntry>;
};

export type MealPlanEntry = {
  date: Scalars['String']['output'];
  entryType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  recipe: Maybe<RecipeSummary>;
  text: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type MealPlanList = {
  items: Array<MealPlanEntry>;
  page: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type MealPlanMeatReminderDay = {
  date: Scalars['String']['output'];
  items: Array<Scalars['String']['output']>;
  recipes: Array<Scalars['String']['output']>;
};

export type MealPlanMeatReminderResult = {
  days: Array<MealPlanMeatReminderDay>;
  success: Scalars['Boolean']['output'];
};

export type MealPlanMutationResult = {
  success: Scalars['Boolean']['output'];
};

export type Measurement = {
  percentile: Maybe<Scalars['Int']['output']>;
  unit: MeasurementUnit;
  value: Maybe<Scalars['Float']['output']>;
};

export type MeasurementUnit =
  | 'cm'
  | 'kg';

export type Milestone = {
  achieved_date: Maybe<Scalars['String']['output']>;
  category: MilestoneCategory;
  detail: Scalars['String']['output'];
  expected_months: Maybe<Array<Scalars['Float']['output']>>;
  expected_weeks: Maybe<Array<Scalars['Int']['output']>>;
  id: Scalars['ID']['output'];
  sources: Array<Scalars['String']['output']>;
  status: MilestoneStatus;
  title: Scalars['String']['output'];
};

export type MilestoneCategory =
  | 'development'
  | 'fine_motor'
  | 'movement';

export type MilestoneStatus =
  | 'done'
  | 'in_progress'
  | 'upcoming'
  | 'watch';

export type Milestones = {
  check_frequency: Scalars['Int']['output'];
  items: Array<Milestone>;
  last_updated: Scalars['String']['output'];
  note: Scalars['String']['output'];
};

export type Mutation = {
  addRecipesToShoppingList: Maybe<AddRecipesToShoppingListResult>;
  checkShoppingItem: Maybe<CheckShoppingItemResult>;
  completeHabit: Maybe<CompleteTaskResult>;
  completeTask: Maybe<CompleteTaskResult>;
  createBudgetItem: Maybe<BudgetMutationResult>;
  createHouseArea: Maybe<HouseMutationResult>;
  createHouseItem: Maybe<HouseMutationResult>;
  createMealPlanEntry: Maybe<MealPlanEntry>;
  createMealPlanMeatReminders: Maybe<MealPlanMeatReminderResult>;
  createRoutineOverride: Maybe<ScheduleMutationResult>;
  createShoppingItem: Maybe<CreateShoppingItemResult>;
  createTask: Maybe<CreateTaskResult>;
  deleteBudgetItem: Maybe<BudgetMutationResult>;
  deleteHouseArea: Maybe<HouseMutationResult>;
  deleteHouseItem: Maybe<HouseMutationResult>;
  deleteMealPlanEntry: Maybe<MealPlanMutationResult>;
  dismissAlert: Maybe<Scalars['Boolean']['output']>;
  markToothErupted: Maybe<Tooth>;
  updateAuslanSignStatus: Maybe<AuslanSign>;
  updateBudgetBucketPercentage: Maybe<BudgetMutationResult>;
  updateBudgetItem: Maybe<BudgetMutationResult>;
  updateDefaultRoutine: Maybe<ScheduleMutationResult>;
  updateHouseArea: Maybe<HouseMutationResult>;
  updateHouseItem: Maybe<HouseMutationResult>;
  updateMe: Maybe<User>;
  updateMealPlanEntry: Maybe<MealPlanEntry>;
  updateMilestoneStatus: Maybe<Milestone>;
  updateSwimSkillStatus: Maybe<SwimSkill>;
  updateTaskStatus: Maybe<CompleteTaskResult>;
};


export type MutationAddRecipesToShoppingListArgs = {
  recipeIds: Array<Scalars['String']['input']>;
};


export type MutationCheckShoppingItemArgs = {
  checked: Scalars['Boolean']['input'];
  itemId: Scalars['String']['input'];
  source: Scalars['String']['input'];
};


export type MutationCompleteHabitArgs = {
  habitId: Scalars['String']['input'];
};


export type MutationCompleteTaskArgs = {
  platform: Platform;
  taskId: Scalars['String']['input'];
};


export type MutationCreateBudgetItemArgs = {
  input: BudgetItemInput;
};


export type MutationCreateHouseAreaArgs = {
  input: HouseAreaInput;
};


export type MutationCreateHouseItemArgs = {
  input: HouseItemInput;
};


export type MutationCreateMealPlanEntryArgs = {
  date: Scalars['String']['input'];
  entryType: Scalars['String']['input'];
  recipeId?: InputMaybe<Scalars['String']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateMealPlanMeatRemindersArgs = {
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};


export type MutationCreateRoutineOverrideArgs = {
  end: Scalars['String']['input'];
  friday: Array<RoutineDayBlockInput>;
  monday: Array<RoutineDayBlockInput>;
  saturday: Array<RoutineDayBlockInput>;
  start: Scalars['String']['input'];
  sunday: Array<RoutineDayBlockInput>;
  thursday: Array<RoutineDayBlockInput>;
  tuesday: Array<RoutineDayBlockInput>;
  user: Scalars['String']['input'];
  wednesday: Array<RoutineDayBlockInput>;
};


export type MutationCreateShoppingItemArgs = {
  note: Scalars['String']['input'];
  quantity?: InputMaybe<Scalars['Float']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateTaskArgs = {
  content: Scalars['String']['input'];
  due?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteBudgetItemArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteHouseAreaArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteHouseItemArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteMealPlanEntryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDismissAlertArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMarkToothEruptedArgs = {
  fdi: Scalars['Int']['input'];
};


export type MutationUpdateAuslanSignStatusArgs = {
  id: Scalars['ID']['input'];
  status: SignStatus;
};


export type MutationUpdateBudgetBucketPercentageArgs = {
  id: Scalars['String']['input'];
  percentage: Scalars['Float']['input'];
};


export type MutationUpdateBudgetItemArgs = {
  id: Scalars['String']['input'];
  input: BudgetItemInput;
};


export type MutationUpdateDefaultRoutineArgs = {
  friday: Array<RoutineDayBlockInput>;
  monday: Array<RoutineDayBlockInput>;
  saturday: Array<RoutineDayBlockInput>;
  sunday: Array<RoutineDayBlockInput>;
  thursday: Array<RoutineDayBlockInput>;
  tuesday: Array<RoutineDayBlockInput>;
  user: Scalars['String']['input'];
  wednesday: Array<RoutineDayBlockInput>;
};


export type MutationUpdateHouseAreaArgs = {
  id: Scalars['String']['input'];
  input: HouseAreaInput;
};


export type MutationUpdateHouseItemArgs = {
  id: Scalars['String']['input'];
  input: HouseItemInput;
};


export type MutationUpdateMeArgs = {
  input: UpdateUserInput;
};


export type MutationUpdateMealPlanEntryArgs = {
  date: Scalars['String']['input'];
  entryType: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  recipeId?: InputMaybe<Scalars['String']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateMilestoneStatusArgs = {
  id: Scalars['ID']['input'];
  status: MilestoneStatus;
};


export type MutationUpdateSwimSkillStatusArgs = {
  id: Scalars['ID']['input'];
  status: MilestoneStatus;
};


export type MutationUpdateTaskStatusArgs = {
  status: Scalars['String']['input'];
  taskId: Scalars['String']['input'];
};

export type NoonarSeason = {
  current: Scalars['String']['output'];
  current_description: Scalars['String']['output'];
  current_period: Scalars['String']['output'];
  next: Scalars['String']['output'];
  next_description: Scalars['String']['output'];
  next_period: Scalars['String']['output'];
  weeks_until_next: Scalars['Int']['output'];
};

export type Note = CarSeat | ParentingApproachNote | ToddlerSleepPrepNote;

export type OutdoorClothingRef = {
  extras: Array<Scalars['String']['output']>;
  feels_like_c_max: Maybe<Scalars['Float']['output']>;
  feels_like_c_min: Maybe<Scalars['Float']['output']>;
  layers: Scalars['Int']['output'];
  recommendation: Scalars['String']['output'];
};

export type Overview = {
  age_months: Scalars['Float']['output'];
  age_weeks: Scalars['Int']['output'];
  birth_month: Scalars['String']['output'];
  last_updated: Scalars['String']['output'];
};

export type PaletteColour = {
  hex: Maybe<Scalars['String']['output']>;
  link: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  text: Maybe<PaletteColour>;
  theme: Maybe<Scalars['String']['output']>;
};

export type ParentingApproachItem = {
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  sources: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type ParentingApproachNote = {
  items: Array<ParentingApproachItem>;
  name: Scalars['String']['output'];
};

export type Platform =
  | 'notion'
  | 'todoist';

export type Project = {
  budget: Maybe<Scalars['String']['output']>;
  completion: Maybe<Scalars['String']['output']>;
  cost: Maybe<Scalars['String']['output']>;
  dates: Maybe<DateRange>;
  id: Maybe<Scalars['String']['output']>;
  link: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  owner: Maybe<User>;
  platform: Maybe<Platform>;
  status: Maybe<Scalars['String']['output']>;
  tasks: Maybe<Array<Maybe<Task>>>;
  type: Maybe<Scalars['String']['output']>;
  uuid: Maybe<Scalars['String']['output']>;
};

export type Query = {
  allergens: Array<Allergen>;
  areas: Maybe<Array<Maybe<Area>>>;
  availableHouseItems: Array<AvailableHouseEntity>;
  budget: Maybe<Array<Maybe<BudgetItem>>>;
  budgetBuckets: Maybe<Array<Maybe<BudgetBucket>>>;
  calendars: Maybe<Array<Maybe<Calendar>>>;
  colour: Maybe<PaletteColour>;
  colours: Maybe<Array<Maybe<PaletteColour>>>;
  contentEntries: Maybe<Array<Maybe<ContentEntry>>>;
  contentIndex: Maybe<Array<Maybe<ContentGroup>>>;
  contentPage: Maybe<ContentPage>;
  events: Maybe<Array<Maybe<Event>>>;
  habits: Maybe<Array<Maybe<Habit>>>;
  homeAssistantState: Maybe<HomeAssistantState>;
  homeAssistantStates: Array<HomeAssistantState>;
  icsEvents: Maybe<Array<Maybe<IcsEvent>>>;
  info: Maybe<Array<Maybe<Info>>>;
  items: Maybe<Array<Maybe<Item>>>;
  me: Maybe<User>;
  mealPlanByDay: Array<MealPlanDay>;
  mealPlans: Maybe<MealPlanList>;
  projects: Maybe<Array<Maybe<Project>>>;
  recipe: Maybe<Recipe>;
  recipeTags: Array<RecipeTag>;
  recipeUnits: Array<RecipeIngredientUnit>;
  recipes: Maybe<RecipeList>;
  resources: Maybe<Array<Maybe<Resource>>>;
  schedule: Array<ScheduleBlock>;
  shoppingList: Maybe<ShoppingList>;
  smallHuman: Maybe<TrackerData>;
  tasks: Maybe<Array<Maybe<Task>>>;
  users: Maybe<Array<Maybe<User>>>;
};


export type QueryAllergensArgs = {
  today: Scalars['String']['input'];
};


export type QueryColourArgs = {
  name: Scalars['String']['input'];
};


export type QueryColoursArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryContentIndexArgs = {
  slug: Scalars['String']['input'];
};


export type QueryContentPageArgs = {
  pageSlug: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};


export type QueryHomeAssistantStateArgs = {
  entityId: Scalars['ID']['input'];
};


export type QueryItemsArgs = {
  raw?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryMealPlanByDayArgs = {
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};


export type QueryMealPlansArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryProjectsArgs = {
  platforms?: InputMaybe<Array<InputMaybe<Platform>>>;
};


export type QueryRecipeArgs = {
  slug: Scalars['String']['input'];
};


export type QueryRecipesArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderByNullPosition?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  queryFilter?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryScheduleArgs = {
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryTasksArgs = {
  platforms?: InputMaybe<Array<InputMaybe<Platform>>>;
};

export type RainSuit = {
  note: Scalars['String']['output'];
  recommended: Scalars['Boolean']['output'];
  trigger: Scalars['String']['output'];
};

export type ReadingItem = {
  id: Scalars['ID']['output'];
  note: Scalars['String']['output'];
  sources: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type Recipe = {
  categories: Array<RecipeCategory>;
  cookTime: Maybe<Scalars['String']['output']>;
  dateAdded: Maybe<Scalars['String']['output']>;
  dateUpdated: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image: Maybe<Scalars['String']['output']>;
  ingredients: Array<RecipeIngredient>;
  instructions: Array<RecipeInstruction>;
  lastMade: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  notes: Array<RecipeNote>;
  nutrition: Maybe<RecipeNutrition>;
  orgURL: Maybe<Scalars['String']['output']>;
  performTime: Maybe<Scalars['String']['output']>;
  prepTime: Maybe<Scalars['String']['output']>;
  rating: Maybe<Scalars['Float']['output']>;
  recipeYield: Maybe<Scalars['String']['output']>;
  servings: Maybe<Scalars['Float']['output']>;
  slug: Scalars['String']['output'];
  tags: Array<RecipeTag>;
  tools: Array<Scalars['String']['output']>;
  totalTime: Maybe<Scalars['String']['output']>;
};

export type RecipeCategory = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type RecipeIngredient = {
  display: Scalars['String']['output'];
  food: Maybe<Scalars['String']['output']>;
  note: Maybe<Scalars['String']['output']>;
  quantity: Maybe<Scalars['Float']['output']>;
  referenceId: Maybe<Scalars['ID']['output']>;
  title: Maybe<Scalars['String']['output']>;
  unit: Maybe<RecipeIngredientUnit>;
};

export type RecipeIngredientUnit = {
  abbreviation: Maybe<Scalars['String']['output']>;
  fraction: Scalars['Boolean']['output'];
  id: Maybe<Scalars['ID']['output']>;
  name: Maybe<Scalars['String']['output']>;
  pluralAbbreviation: Maybe<Scalars['String']['output']>;
  pluralName: Maybe<Scalars['String']['output']>;
  standardQuantity: Maybe<Scalars['Float']['output']>;
  standardUnit: Maybe<Scalars['String']['output']>;
  useAbbreviation: Scalars['Boolean']['output'];
};

export type RecipeInstruction = {
  id: Scalars['ID']['output'];
  position: Scalars['Int']['output'];
  text: Scalars['String']['output'];
  title: Maybe<Scalars['String']['output']>;
};

export type RecipeList = {
  items: Array<RecipeSummary>;
  page: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type RecipeNote = {
  text: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type RecipeNutrition = {
  calories: Maybe<Scalars['String']['output']>;
  carbohydrateContent: Maybe<Scalars['String']['output']>;
  fatContent: Maybe<Scalars['String']['output']>;
  fiberContent: Maybe<Scalars['String']['output']>;
  proteinContent: Maybe<Scalars['String']['output']>;
  sodiumContent: Maybe<Scalars['String']['output']>;
  sugarContent: Maybe<Scalars['String']['output']>;
};

export type RecipeSummary = {
  categories: Array<RecipeCategory>;
  cookTime: Maybe<Scalars['String']['output']>;
  dateAdded: Maybe<Scalars['String']['output']>;
  dateUpdated: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image: Maybe<Scalars['String']['output']>;
  lastMade: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  orgURL: Maybe<Scalars['String']['output']>;
  performTime: Maybe<Scalars['String']['output']>;
  prepTime: Maybe<Scalars['String']['output']>;
  rating: Maybe<Scalars['Float']['output']>;
  recipeYield: Maybe<Scalars['String']['output']>;
  servings: Maybe<Scalars['Float']['output']>;
  slug: Scalars['String']['output'];
  tags: Array<RecipeTag>;
  totalTime: Maybe<Scalars['String']['output']>;
};

export type RecipeTag = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type RecommendedSetup = {
  pj_layer: Scalars['String']['output'];
  reasoning: Scalars['String']['output'];
  sleep_sack_tog: Scalars['Float']['output'];
};

export type Resource = {
  category: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  icon: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  image: Maybe<Scalars['String']['output']>;
  login: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

export type RoutineDayBlockInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  end: Scalars['String']['input'];
  label: Scalars['String']['input'];
  start: Scalars['String']['input'];
};

export type ScheduleBlock = {
  colour: Maybe<Scalars['String']['output']>;
  end: Scalars['String']['output'];
  family: Maybe<User>;
  id: Scalars['ID']['output'];
  isOverride: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  start: Scalars['String']['output'];
};

export type ScheduleMutationResult = {
  success: Scalars['Boolean']['output'];
};

export type SeasonalAlert = {
  action: Scalars['String']['output'];
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  type: AlertType;
  weeks_ahead: Scalars['Int']['output'];
};

export type ShoppingItem = {
  category: Maybe<Scalars['String']['output']>;
  checked: Scalars['Boolean']['output'];
  display: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  labels: Maybe<Array<Scalars['String']['output']>>;
  link: Maybe<Scalars['String']['output']>;
  note: Maybe<Scalars['String']['output']>;
  position: Maybe<Scalars['Int']['output']>;
  quantity: Maybe<Scalars['Float']['output']>;
  recipes: Maybe<Array<ShoppingItemRecipe>>;
  source: Scalars['String']['output'];
};

export type ShoppingItemRecipe = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type ShoppingList = {
  items: Array<ShoppingItem>;
  storeGroups: Array<ShoppingListStoreGroup>;
};

export type ShoppingListStoreGroup = {
  items: Array<ShoppingItem>;
  name: Scalars['String']['output'];
  subGroups: Array<ShoppingListSubGroup>;
};

export type ShoppingListSubGroup = {
  items: Array<ShoppingItem>;
  name: Scalars['String']['output'];
};

export type SignStatus =
  | 'coming_soon'
  | 'done'
  | 'in_progress'
  | 'introduce_next'
  | 'recognises'
  | 'signing_occasionally';

export type SignbankWord = {
  note: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
  video: Maybe<Scalars['String']['output']>;
};

export type Sleep = {
  check_frequency: Scalars['Int']['output'];
  current_pattern: SleepPattern;
  environment: SleepEnvironment;
  framework: Scalars['String']['output'];
  items: Array<SleepItem>;
  last_updated: Scalars['String']['output'];
};

export type SleepEnvironment = {
  bedroom_temp_pattern: BedroomTempPattern;
  current_recommendation: TogRecommendation;
  current_sizes: Array<Scalars['String']['output']>;
  note: Scalars['String']['output'];
  size_watch: Scalars['String']['output'];
  sleep_sacks_on_hand: Array<SleepSack>;
  tog_reference: Array<TogReference>;
};

export type SleepItem = {
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  sources: Array<Scalars['String']['output']>;
  status: MilestoneStatus;
  tag: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type SleepPattern = {
  bedtime: Scalars['String']['output'];
  nap_cap: Scalars['Boolean']['output'];
  nap_cutoff: Scalars['String']['output'];
  nap_duration_range_max: Scalars['Int']['output'];
  nap_duration_range_min: Scalars['Int']['output'];
  nap_duration_typical: Scalars['String']['output'];
  nap_transition: Maybe<Scalars['String']['output']>;
  naps: Scalars['Int']['output'];
  night_waking_pattern: Scalars['String']['output'];
  note: Scalars['String']['output'];
  suspected_cause: Scalars['String']['output'];
  total_daytime_sleep_approx: Scalars['String']['output'];
  typical_wake: Scalars['String']['output'];
};

export type SleepSack = {
  material: Scalars['String']['output'];
  note: Maybe<Scalars['String']['output']>;
  sizes: Array<Scalars['String']['output']>;
  tog: Scalars['Float']['output'];
};

export type SleeveLength =
  | 'long'
  | 'none'
  | 'short';

export type Source = {
  approved: Scalars['Boolean']['output'];
  badge: Scalars['String']['output'];
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  note: Maybe<Scalars['String']['output']>;
  priority: Scalars['Int']['output'];
  url: Scalars['String']['output'];
};

export type SunSafety = {
  note: Scalars['String']['output'];
  sources: Array<Scalars['String']['output']>;
  uv_threshold_for_coverage: Scalars['Int']['output'];
};

export type SwimSkill = {
  detail: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  status: MilestoneStatus;
  title: Scalars['String']['output'];
};

export type Swimming = {
  check_frequency: Scalars['Int']['output'];
  last_updated: Scalars['String']['output'];
  note: Scalars['String']['output'];
  skills: Array<SwimSkill>;
  sources: Array<Scalars['String']['output']>;
};

export type Task = {
  allDay: Maybe<Scalars['Boolean']['output']>;
  assigned: Array<User>;
  due: Maybe<Scalars['String']['output']>;
  dueLabel: Maybe<Scalars['String']['output']>;
  end: Maybe<Scalars['String']['output']>;
  estimate: Maybe<Scalars['Float']['output']>;
  id: Maybe<Scalars['String']['output']>;
  link: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  parent: Maybe<Array<Maybe<Task>>>;
  platform: Maybe<Platform>;
  project: Maybe<Array<Maybe<Project>>>;
  status: Maybe<Scalars['String']['output']>;
  subtasks: Maybe<Array<Maybe<Task>>>;
  tags: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  uuid: Maybe<Scalars['String']['output']>;
};


export type TaskDueLabelArgs = {
  daysAhead?: InputMaybe<Scalars['Int']['input']>;
  today: Scalars['String']['input'];
};

export type Teeth = {
  check_frequency: Scalars['Int']['output'];
  dental_care: DentalCare;
  last_updated: Scalars['String']['output'];
  note: Scalars['String']['output'];
  possums_note: Scalars['String']['output'];
  teeth: Array<Tooth>;
  teething_note: Maybe<Scalars['String']['output']>;
  teething_now: Scalars['Boolean']['output'];
};

export type ToddlerPrepStatus =
  | 'due'
  | 'not_yet_due';

export type ToddlerSleepPrepDetail = {
  alert_when_due: Alert;
  note: Scalars['String']['output'];
  reading: Array<ReadingItem>;
  sources: Array<Scalars['String']['output']>;
  status: ToddlerPrepStatus;
  trigger_age_weeks: Scalars['Int']['output'];
};

export type ToddlerSleepPrepNote = {
  items: ToddlerSleepPrepDetail;
  name: Scalars['String']['output'];
};

export type TogRecommendation = {
  challenge: Scalars['String']['output'];
  recommended_setup: RecommendedSetup;
  sources: Array<Scalars['String']['output']>;
  strategy: Scalars['String']['output'];
};

export type TogReference = {
  layer: Scalars['String']['output'];
  temp_range_c: Scalars['String']['output'];
  tog: Scalars['Float']['output'];
};

export type Tooth = {
  erupted_age_months: Maybe<Scalars['Int']['output']>;
  erupted_date: Maybe<Scalars['String']['output']>;
  expected_months: Scalars['String']['output'];
  fdi: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  sources: Array<Scalars['String']['output']>;
  status: ToothStatus;
};

export type ToothStatus =
  | 'erupted'
  | 'not_yet'
  | 'upcoming';

export type TrackerData = {
  activities: Array<Activity>;
  alerts: Array<Alert>;
  auslan: Auslan;
  clothing: Clothing;
  feeding: Feeding;
  growth: Growth;
  milestones: Milestones;
  notes: Array<Note>;
  overview: Overview;
  sleep: Sleep;
  sources: Array<Source>;
  swimming: Swimming;
  teeth: Teeth;
  vaccinations: Vaccinations;
};


export type TrackerDataAlertsArgs = {
  orderBy?: InputMaybe<AlertOrderBy>;
};

export type UpdateUserInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notionId?: InputMaybe<Scalars['String']['input']>;
  todoistId?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  colour: Maybe<Scalars['String']['output']>;
  ids: Maybe<UserIds>;
  name: Maybe<Scalars['String']['output']>;
  profile: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
};

export type UserIds = {
  notion: Maybe<Scalars['String']['output']>;
  todoist: Maybe<Scalars['String']['output']>;
};

export type VaccinationItem = {
  date: Maybe<Scalars['String']['output']>;
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  next_due: Maybe<Scalars['String']['output']>;
  status: VaccinationStatus;
  title: Scalars['String']['output'];
  todoist_task: Maybe<Task>;
};

export type VaccinationOrderBy =
  | 'due_date';

export type VaccinationStatus =
  | 'done'
  | 'upcoming'
  | 'watch';

export type Vaccinations = {
  check_frequency: Scalars['Int']['output'];
  items: Array<VaccinationItem>;
  last_updated: Scalars['String']['output'];
  note: Scalars['String']['output'];
  sources: Array<Scalars['String']['output']>;
};


export type VaccinationsItemsArgs = {
  orderBy?: InputMaybe<VaccinationOrderBy>;
};

export type ValueNote = {
  note: Scalars['String']['output'];
  unit: Maybe<Scalars['String']['output']>;
  value: Maybe<Array<Scalars['Float']['output']>>;
};
