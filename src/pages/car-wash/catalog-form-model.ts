export type CatalogForm = {
  title: string;
  description: string;
  price: string;
  pricesWithoutDiscounts: string;
  isActive: boolean;
  serviceIds: string[];
};

export type FormErrors = Partial<Record<keyof CatalogForm | "image", string>>;

export const validateImage = (file: Pick<File, "type" | "size">): string | undefined => {
  if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
    return "Only PNG, JPG, JPEG or WEBP images are allowed.";
  }
  if (file.size === 0) return "Choose an image file that is not empty.";
  if (file.size > 5 * 1024 * 1024) return "Image size must not exceed 5 MB.";
};

export const validateCatalogForm = (
  form: CatalogForm,
  isPackage: boolean,
  regularTotal: number,
  requiresImage: boolean,
  hasImage: boolean,
): FormErrors => {
  const errors: FormErrors = {};
  if (form.title.trim().length < 3) errors.title = "Enter a title with at least 3 characters.";
  if (form.description.trim().length < 10) errors.description = "Enter a description with at least 10 characters.";
  if (!form.price.trim() || !Number.isFinite(Number(form.price)) || Number(form.price) <= 0) {
    errors.price = "Enter a valid price greater than zero.";
  }
  if (isPackage) {
    if (!form.serviceIds.length) errors.serviceIds = "Select at least one service.";
    if (regularTotal <= 0) errors.pricesWithoutDiscounts = "Select services with a regular total greater than zero.";
    if (Number(form.price) > regularTotal) errors.price = "Package price cannot exceed the regular total price.";
  }
  if (requiresImage && !hasImage) errors.image = "An image is required when creating a new item.";
  return errors;
};
