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
  due: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isRecurring: Scalars['Boolean']['output'];
  link: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type Area = {
  colour: Maybe<Scalars['String']['output']>;
  id: AreaId;
  info: Maybe<Array<Maybe<Info>>>;
  items: Maybe<Array<Maybe<Item>>>;
  link: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  size: Array<Scalars['Float']['output']>;
  start: Array<Scalars['Float']['output']>;
};

export type AreaId =
  | 'backyard'
  | 'bathroom'
  | 'bedroom_main'
  | 'dining'
  | 'frontyard'
  | 'kitchen'
  | 'laundry'
  | 'living'
  | 'office_amy'
  | 'office_dan'
  | 'outside'
  | 'porch'
  | 'shed'
  | 'toilet'
  | 'virtual';

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

export type BedroomTempPattern = {
  bedtime_temp_c: Scalars['Float']['output'];
  early_morning_temp_c: Scalars['Float']['output'];
  swing_note: Scalars['String']['output'];
};

export type Calendar = {
  colour: Maybe<Scalars['String']['output']>;
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
  next_transition: Scalars['String']['output'];
  sources: Array<Scalars['String']['output']>;
};

export type CheckShoppingItemResult = {
  success: Scalars['Boolean']['output'];
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

export type Colour =
  | 'blue'
  | 'blue_light'
  | 'blue_mid'
  | 'blue_navy'
  | 'green'
  | 'green_dark'
  | 'green_light'
  | 'green_lime'
  | 'green_teal'
  | 'orange'
  | 'orange_dark'
  | 'orange_peach'
  | 'pink'
  | 'pink_dark'
  | 'purple'
  | 'purple_bright'
  | 'purple_light'
  | 'red'
  | 'yellow';

export type CompleteTaskResult = {
  success: Scalars['Boolean']['output'];
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

export type IcsEvent = {
  allDay: Maybe<Scalars['Boolean']['output']>;
  colour: Maybe<Scalars['String']['output']>;
  dates: Maybe<IcsEventDateRange>;
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
  link: Maybe<Scalars['String']['output']>;
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

export type Measurement = {
  percentile: Maybe<Scalars['Int']['output']>;
  unit: MeasurementUnit;
  value: Maybe<Scalars['Float']['output']>;
};

export type MeasurementUnit =
  | 'cm'
  | 'kg';

export type Meta = {
  age_weeks: Scalars['Int']['output'];
  birth_month: Scalars['String']['output'];
  last_updated: Scalars['String']['output'];
};

export type Milestone = {
  achieved_date: Maybe<Scalars['String']['output']>;
  category: MilestoneCategory;
  detail: Scalars['String']['output'];
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
  checkShoppingItem: Maybe<CheckShoppingItemResult>;
  completeTask: Maybe<CompleteTaskResult>;
  markToothErupted: Maybe<Tooth>;
  updateAuslanSignStatus: Maybe<AuslanSign>;
  updateMilestoneStatus: Maybe<Milestone>;
  updateSwimSkillStatus: Maybe<SwimSkill>;
};


export type MutationCheckShoppingItemArgs = {
  checked: Scalars['Boolean']['input'];
  itemId: Scalars['String']['input'];
  source: Scalars['String']['input'];
};


export type MutationCompleteTaskArgs = {
  taskId: Scalars['String']['input'];
};


export type MutationMarkToothEruptedArgs = {
  fdi: Scalars['Int']['input'];
};


export type MutationUpdateAuslanSignStatusArgs = {
  id: Scalars['ID']['input'];
  status: SignStatus;
};


export type MutationUpdateMilestoneStatusArgs = {
  id: Scalars['ID']['input'];
  status: MilestoneStatus;
};


export type MutationUpdateSwimSkillStatusArgs = {
  id: Scalars['ID']['input'];
  status: MilestoneStatus;
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

export type OutdoorClothingRef = {
  extras: Array<Scalars['String']['output']>;
  feels_like_c_max: Maybe<Scalars['Float']['output']>;
  feels_like_c_min: Maybe<Scalars['Float']['output']>;
  layers: Scalars['Int']['output'];
  recommendation: Scalars['String']['output'];
};

export type ParentingApproachItem = {
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  sources: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
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
  calendars: Maybe<Array<Maybe<Calendar>>>;
  events: Maybe<Array<Maybe<Event>>>;
  icsEvents: Maybe<Array<Maybe<IcsEvent>>>;
  info: Maybe<Array<Maybe<Info>>>;
  items: Maybe<Array<Maybe<Item>>>;
  mealPlans: Maybe<MealPlanList>;
  projects: Maybe<Array<Maybe<Project>>>;
  recipe: Maybe<Recipe>;
  recipeTags: Array<RecipeTag>;
  recipes: Maybe<RecipeList>;
  resources: Maybe<Array<Maybe<Resource>>>;
  shoppingList: Maybe<ShoppingList>;
  smallHuman: Maybe<TrackerData>;
  tasks: Maybe<Array<Maybe<Task>>>;
  users: Maybe<Array<Maybe<User>>>;
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
  unit: Maybe<Scalars['String']['output']>;
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
  source: Scalars['String']['output'];
};

export type ShoppingList = {
  items: Array<ShoppingItem>;
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
  assigned: Maybe<Array<Maybe<User>>>;
  due: Maybe<Scalars['String']['output']>;
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

export type ToddlerSleepPrep = {
  alert_when_due: Alert;
  note: Scalars['String']['output'];
  reading: Array<ReadingItem>;
  sources: Array<Scalars['String']['output']>;
  status: ToddlerPrepStatus;
  trigger_age_weeks: Scalars['Int']['output'];
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
  car_seat: CarSeat;
  clothing_daytime: ClothingDaytime;
  clothing_seasonal: ClothingSeasonal;
  feeding: Feeding;
  food_principles: FoodPrinciples;
  growth: Growth;
  meta: Meta;
  milestones: Milestones;
  parenting_approach: Array<ParentingApproachItem>;
  sleep: Sleep;
  sleep_environment: SleepEnvironment;
  sources: Array<Source>;
  swimming: Swimming;
  teeth: Teeth;
  toddler_sleep_prep: ToddlerSleepPrep;
  vaccinations: Vaccinations;
};


export type TrackerDataAlertsArgs = {
  orderBy?: InputMaybe<AlertOrderBy>;
};

export type User = {
  colour: Maybe<Colour>;
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
