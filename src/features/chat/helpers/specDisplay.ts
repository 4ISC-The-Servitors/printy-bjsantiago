import {
  fetchServiceByDisplayId,
  getCategoryById,
} from '@features/chat/api/servicesApi';

export async function formatServiceLabel(
  serviceId?: string
): Promise<string | undefined> {
  if (!serviceId) return undefined;
  try {
    const svc = await fetchServiceByDisplayId(serviceId);
    if (svc?.service_name) {
      return svc.service_name;
    }
  } catch {}
  return undefined;
}

export async function resolveCategoryName(
  categoryId?: string
): Promise<string | undefined> {
  if (!categoryId) return undefined;
  try {
    const cat = await getCategoryById(categoryId);
    return cat?.category_name || undefined;
  } catch {
    return undefined;
  }
}

export async function buildSpecHeaderLines(spec: {
  service_id?: string;
  category?: string;
}): Promise<string[]> {
  const lines: string[] = [];
  const serviceLabel = await formatServiceLabel(spec.service_id);
  if (serviceLabel) lines.push(`• Service: ${serviceLabel}`);
  const categoryName = await resolveCategoryName(spec.category);
  if (categoryName) lines.push(`• Category: ${categoryName}`);
  return lines;
}

export function buildSpecDetailLines(
  spec: {
    product_name?: string;
    product?: string;
    description?: string;
    quantity?: number;
    size?: string;
    color?: string;
    materials?: string[] | string;
    finishing?: string[] | string;
    deadline?: string;
    delivery_method?: string;
  },
  adminNotes?: string
): string[] {
  const lines: string[] = [];
  const productName = spec.product_name || spec.product;
  if (productName) lines.push(`• Product: ${productName}`);
  if (spec.description) lines.push(`• Description: ${spec.description}`);
  if (spec.quantity != null) lines.push(`• Quantity: ${spec.quantity}`);
  if (spec.size) lines.push(`• Size: ${spec.size}`);
  if (spec.color) lines.push(`• Color: ${spec.color}`);

  const materials = Array.isArray(spec.materials)
    ? spec.materials
    : spec.materials
      ? [spec.materials]
      : [];
  if (materials.length > 0) {
    lines.push(`• Materials: ${materials.join(', ')}`);
  }

  const finishing = Array.isArray(spec.finishing)
    ? spec.finishing
    : spec.finishing
      ? [spec.finishing]
      : [];
  if (finishing.length > 0) {
    lines.push(`• Finishing: ${finishing.join(', ')}`);
  }

  if (spec.deadline) lines.push(`• Deadline: ${spec.deadline}`);
  if (spec.delivery_method)
    lines.push(`• Delivery Method: ${spec.delivery_method}`);
  if (adminNotes) lines.push(`• Admin Notes: ${adminNotes}`);
  return lines;
}
