# Organization Logos

This directory contains organization logos for display in the leaderboard.

To use your own logos, place .png files with the following naming convention:
- openai.png
- anthropic.png
- meta.png
- google.png
- mistral.png
- microsoft.png
- deepseek.png
- cohere.png
- huggingface.png
- alibaba.png
- 01ai.png

Note: The logos should be square or nearly square for best display results. Recommended size is 128x128 pixels. 

# How to import

If want to import the png (and other version) of icons, you need to map the organization name to the path of the image (ORGANIZATION_LOGOS in the lib/organization-logos.ts)

If using the svg version, you need to map the organization name to the svg item (SVG_LOGOS in the lib/organization-logos.ts)

After that, you need to link the model-name to the corresponding organization (MODEL_TO_ORG_MAP in the lib.organization-logos.ts)