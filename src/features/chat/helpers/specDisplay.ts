import { fetchServiceByDisplayId, getCategoryById } from '@features/chat/api/servicesApi';

export async function formatServiceLabel(serviceId?: string): Promise<string | undefined> {
  if (!serviceId) return undefined;
  try {
    const svc = await fetchServiceByDisplayId(serviceId);
    if (svc?.service_name) {
      return `${serviceId} (${svc.service_name})`;
    }
  } catch {}
  return serviceId;
}

export async function resolveCategoryName(categoryId?: string): Promise<string | undefined> {
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

export function buildSpecDetailLines(spec: {
  product_name?: string;
  description?: string;
  quantity?: number;
  size?: string;
  color?: string;
  materials?: string[];
  finishing?: string[];
  deadline?: string;
}, adminNotes?: string): string[] {
  const lines: string[] = [];
  if (spec.product_name) lines.push(`• Product: ${spec.product_name}`);
  if (spec.description) lines.push(`• Description: ${spec.description}`);
  if (spec.quantity != null) lines.push(`• Quantity: ${spec.quantity}`);
  if (spec.size) lines.push(`• Size: ${spec.size}`);
  if (spec.color) lines.push(`• Color: ${spec.color}`);
  if (Array.isArray(spec.materials) && spec.materials.length > 0) {
    lines.push(`• Materials: ${spec.materials.join(', ')}`);
  }
  if (Array.isArray(spec.finishing) && spec.finishing.length > 0) {
    lines.push(`• Finishing: ${spec.finishing.join(', ')}`);
  }
  if (spec.deadline) lines.push(`• Deadline: ${spec.deadline}`);
  if (adminNotes) lines.push(`• Admin Notes: ${adminNotes}`);
  return lines;
}



