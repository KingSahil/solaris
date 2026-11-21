import { z } from 'zod';
import { request } from './client';

const pageSchema = <T extends z.ZodType>(item: T) => z.object({
  items: z.array(item), page: z.number().int(), pageSize: z.number().int(), totalCount: z.number().int(),
});

export const installationSchema = z.object({
  id: z.number().int(), customerName: z.string(), location: z.string(),
  status: z.enum(['Survey', 'Design', 'Permits', 'Installation', 'Inspection', 'Active', 'Cancelled', 'Deactivated']),
  timeZone: z.string(), createdAt: z.iso.datetime(),
});
export const installationsPageSchema = pageSchema(installationSchema);
export const productionSchema = z.object({
  day: z.iso.date().nullable(), installationCount: z.number().int(),
  healthCounts: z.array(z.object({ health: z.enum(['Excellent', 'Good', 'Warning', 'Critical', 'Offline']), count: z.number().int() })),
  worstPerformers: z.array(z.object({ installationId: z.number().int(), customerName: z.string(), actualKwh: z.number(), expectedKwh: z.number(), health: z.enum(['Excellent', 'Good', 'Warning', 'Critical', 'Offline']), readingCount: z.number().int() })),
});

export const INSTALLATIONS_PAGE_SIZE = 20;
export const installationPageKey = (page: number) => ['installations', page] as const;
export const PRODUCTION_KEY = ['production'] as const;
export const fetchInstallations = (page: number, signal?: AbortSignal) =>
  request(`/staff-data/installations?page=${page}&pageSize=${INSTALLATIONS_PAGE_SIZE}`, { schema: installationsPageSchema, signal });
export const fetchProduction = (signal?: AbortSignal) =>
  request('/staff-data/production', { schema: productionSchema, signal });
