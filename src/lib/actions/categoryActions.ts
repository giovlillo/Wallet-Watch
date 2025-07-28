"use server";

import { z } from 'zod';
import { 
  getCategories as getAllCategories, 
  getCategoryById as getCategoryDetails,
  createCategory as createNewCategory,
  updateCategory as updateExistingCategory,
  deleteCategory as deleteExistingCategory
} from '@/lib/data';
import type { Category } from '@/lib/types';

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional(),
  icon: z.string().min(1, "Icon is required"), // Assuming icon is a lucide icon name
});

export async function getCategories() {
  return getAllCategories();
}

export async function getCategoryById(id: string) {
  return getCategoryDetails(id);
}

export async function createCategory(formData: unknown) {
  const parsed = categorySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Invalid data", issues: parsed.error.issues };
  }
  try {
    const newCategory = await createNewCategory(parsed.data);
    return { success: true, category: newCategory };
  } catch (e) {
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, formData: unknown) {
  const parsed = categorySchema.partial().safeParse(formData); // Partial for updates
  if (!parsed.success) {
    return { success: false, error: "Invalid data", issues: parsed.error.issues };
  }
  try {
    const updatedCategory = await updateExistingCategory(id, parsed.data);
    if (!updatedCategory) return { success: false, error: "Category not found" };
    return { success: true, category: updatedCategory };
  } catch (e) {
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const success = await deleteExistingCategory(id);
    if (!success) return { success: false, error: "Category not found or deletion failed" };
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to delete category" };
  }
}
