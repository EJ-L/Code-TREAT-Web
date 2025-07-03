import React from 'react';
import { 
  ORGANIZATION_LOGOS, 
  SVG_LOGOS, 
  OrganizationLogoProps, 
  getOrganizationFromModel 
} from '@/lib/organization-logos';

const OrganizationLogo: React.FC<OrganizationLogoProps> = ({ organization, size = 16 }) => {
  // Get the organization key (lowercase for consistency)
  const orgKey = organization.toLowerCase();
  
  // Check if we have an SVG logo for this organization
  if (SVG_LOGOS[orgKey]) {
    const svgInfo = SVG_LOGOS[orgKey];
    
    return (
      <div 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={organization}
        className="shrink-0"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox={svgInfo.viewBox} 
          preserveAspectRatio="xMidYMid meet"
          width={size}
          height={size}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            display: 'block'
          }}
        >
          <g transform={svgInfo.transform}>
            {svgInfo.paths.map((path, index) => (
              <path 
                key={index} 
                d={path} 
                fill={index === 3 && orgKey === 'google' ? '#EA4335' : 
                     index === 2 && orgKey === 'google' ? '#FBBC05' : 
                     index === 1 && orgKey === 'google' ? '#34A853' : 
                     index === 0 && orgKey === 'google' ? '#4285F4' : 
                     index === 4 && orgKey === 'google' ? 'none' : 
                     index === 0 && orgKey === 'meta' ? '#0081fb' :
                     index === 1 && orgKey === 'meta' ? '#0064e1' :
                     index === 2 && orgKey === 'meta' ? '#0064e0' :
                     index === 0 && orgKey === 'mistral' ? '#000000' :
                     index === 1 && orgKey === 'mistral' ? '#F7D046' :
                     index === 2 && orgKey === 'mistral' ? '#F2A73B' :
                     index === 3 && orgKey === 'mistral' ? '#EE792F' :
                     index === 4 && orgKey === 'mistral' ? '#EB5829' :
                     index === 5 && orgKey === 'mistral' ? '#EA3326' :
                     orgKey === 'deepseek' ? '#4D6BFE' :
                     orgKey === 'anthropic' ? '#000000' :
                     orgKey === 'xai' ? '#000000' :
                     'currentColor'}
                style={{
                  fillOpacity: orgKey === 'xai' ? 1 : undefined
                }}
              />
            ))}
          </g>
        </svg>
      </div>
    );
  }
  
  // Otherwise use image file if available
  if (ORGANIZATION_LOGOS[orgKey]) {
    return (
      <div 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className="shrink-0"
      >
        <img
          src={ORGANIZATION_LOGOS[orgKey]}
          alt={`${organization} logo`}
          title={organization}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          onError={(e) => {
            // Hide the image if it fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }
  
  // Fallback to empty div with correct dimensions
  return <div style={{ width: `${size}px`, height: `${size}px` }} className="shrink-0" />;
};

export default OrganizationLogo; 