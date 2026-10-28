import { z } from 'zod';

export const CSSPropertiesSchema = z.record(z.string(), z.union([z.string(), z.number()]));
export type CSSProperties = z.infer<typeof CSSPropertiesSchema>;

export const ResponsiveStyleSchema = z.object({
  base: CSSPropertiesSchema.default({}),
  mobile: CSSPropertiesSchema.optional(),
  tablet: CSSPropertiesSchema.optional(),
  desktop: CSSPropertiesSchema.optional(),
  wide: CSSPropertiesSchema.optional(),
  hover: CSSPropertiesSchema.optional(),
  focus: CSSPropertiesSchema.optional(),
  active: CSSPropertiesSchema.optional(),
  disabled: CSSPropertiesSchema.optional()
}).prefault({});

export type ResponsiveStyle = z.infer<typeof ResponsiveStyleSchema>;
