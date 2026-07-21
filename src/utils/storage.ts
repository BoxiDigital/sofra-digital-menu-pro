import { Category, Dish, RestaurantConfig } from "../types";
import { defaultCategories, defaultDishes, defaultRestaurantConfig } from "../data/defaultData";

const CATEGORIES_KEY = "sofra_categories";
const DISHES_KEY = "sofra_dishes";
const CONFIG_KEY = "sofra_config";

export const getCategories = (): Category[] => {
  const data = localStorage.getItem(CATEGORIES_KEY);
  if (!data) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
    return defaultCategories;
  }
  return JSON.parse(data);
};

export const saveCategories = (categories: Category[]) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const getDishes = (): Dish[] => {
  const data = localStorage.getItem(DISHES_KEY);
  if (!data) {
    localStorage.setItem(DISHES_KEY, JSON.stringify(defaultDishes));
    return defaultDishes;
  }
  return JSON.parse(data);
};

export const saveDishes = (dishes: Dish[]) => {
  localStorage.setItem(DISHES_KEY, JSON.stringify(dishes));
};

export const getRestaurantConfig = (): RestaurantConfig => {
  const data = localStorage.getItem(CONFIG_KEY);
  if (!data) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultRestaurantConfig));
    return defaultRestaurantConfig;
  }
  return JSON.parse(data);
};

export const saveRestaurantConfig = (config: RestaurantConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const resetToDefault = () => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
  localStorage.setItem(DISHES_KEY, JSON.stringify(defaultDishes));
  localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultRestaurantConfig));
};
