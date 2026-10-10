export type MenuForm = {
  name: string;
  price: string;
  category: number;
  description: string;
  facts: string;
  ingredients: string[];
  preparationTimeInMinutes: string;
  portionSize: string;
  isActive: boolean;
};
export type MenuErrors = Partial<Record<keyof MenuForm | "image", string>>;
export const CATEGORY_OPTIONS = [
  { value: "1", label: "Breakfast" },
  { value: "4", label: "Coffee" },
];
export const isDrink = (category: number) => category === 4;
export const emptyMenuForm: MenuForm = {
  name: "", price: "", category: 1, description: "", facts: "", ingredients: [],
  preparationTimeInMinutes: "", portionSize: "", isActive: true,
};
export const validateMenuForm = (form: MenuForm, hasImage: boolean): MenuErrors => {
  const errors: MenuErrors = {};
  if (!form.name.trim()) errors.name = "Menu item name is required.";
  if (!form.price.trim() || !Number.isFinite(Number(form.price)) || Number(form.price) <= 0) {
    errors.price = "Enter a valid price greater than zero.";
  }
  if (!CATEGORY_OPTIONS.some((option) => Number(option.value) === form.category)) errors.category = "Select a valid category.";
  if (!isDrink(form.category)) {
    const portion = Number(form.portionSize);
    if (!form.portionSize.trim() || !Number.isInteger(portion) || portion < 1 || portion > 4) {
      errors.portionSize = "Select a portion from 1 to 4.";
    }
    const minutes = Number(form.preparationTimeInMinutes);
    if (!form.preparationTimeInMinutes.trim() || !Number.isInteger(minutes) || minutes < 0 || minutes > 60) {
      errors.preparationTimeInMinutes = "Enter a whole number from 0 to 60 minutes.";
    }
  }
  if (!hasImage) errors.image = "Upload an image for the menu item.";
  if (form.ingredients.join(",").length > 1000) errors.ingredients = "Ingredients or includes must not exceed 1,000 characters.";
  return errors;
};
export const buildMenuPayload = (form: MenuForm, id?: string, image?: File | null) => {
  const payload = new FormData();
  if (id) payload.append("Id", id);
  payload.append("Name", form.name.trim());
  payload.append("Price", String(Number(form.price)));
  payload.append("Category", String(form.category));
  payload.append("Description", form.description.trim());
  payload.append("Facts", form.facts.trim());
  payload.append("Ingredients", form.ingredients.map((value) => value.trim()).filter(Boolean).join(","));
  payload.append("PreparationTimeInMinutes", form.preparationTimeInMinutes || "0");
  payload.append("PortionSize", form.portionSize || "0");
  payload.append("IsActive", String(form.isActive));
  if (image) payload.append("Image", image);
  return payload;
};
