# Here is the guideline to add the model's icon

## Target File

- The target file is in `/src/lib/organization-logos.ts`

## Steps

- To add the model to icon mapping, you need to config the two mappings
  1. Model <-> Organization mapping
  2. Organization <-> Icon file mapping
- For (1), you need to config the `MODEL_TO_ORG_MAP` to add the organization name
- For (2):
  1. If the icon path is in PNG format, you need to add the organization name and the PNG location in `ORGANIZATION_LOGOS`
  2. If the icon path is in SVG format, you need to add the organization name as well as the SVG code in `SVG_LOGOS`
- The default PNG path is in `public/logos`