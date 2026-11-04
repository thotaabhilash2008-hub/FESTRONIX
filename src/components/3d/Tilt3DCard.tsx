import React from 'react';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Standard Card Wrapper - replaces artificial 3D gyroscope tilt with grounded,
 * stable presentation and subtle CSS transitions.
 */
export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  style = {},
  onClick
}) => {
  return (
    <div
      className={`human-card-container ${className}`}
      onClick={onClick}
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default Tilt3DCard;
